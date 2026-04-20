const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const { db, admin } = require("../config/firebase");
const Enrollment = require("../models/Enrollment"); // تأكد من المسار الصح للموديل بتاعك
const Course = require("../models/Course"); // تأكد من استيراد موديل الكورس
/**
 * @desc Create a Stripe Checkout Session
 * @route POST /api/payments/checkout
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    const { courseId, studentId, studentName } = req.body;

    // 1️⃣ التأكد من وجود البيانات الأساسية
    if (!courseId || !studentId) {
      return res.status(400).json({ success: false, message: "Missing courseId or studentId." });
    }

    // 2️⃣ 🔍 جلب بيانات الكورس من الداتابيز (لضمان السعر الحقيقي)
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found in database." });
    }

    // 3️⃣ إنشاء الجلسة بالسعر المستخرج من الداتابيز
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: course.title.en || "Course Enrollment", // الاسم من الداتابيز
            },
            unit_amount: course.price * 100, // السعر من الداتابيز (مضروب في 100 للسنتات)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/course/${courseId}?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/course/${courseId}?payment=cancel`,
      metadata: {
        courseId,
        studentId,
        studentName: studentName || "Student", 
      },
    });

    res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).json({ success: false, message: "Failed to create checkout session." });
  }
};
/**
 * @desc Handle Stripe Webhook
 * @route POST /api/payments/webhook
 */
exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook Signature Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // لما عملية الدفع تنجح
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    // الداتا دي إنت باعتها أصلاً في الـ metadata وأنت بتكريت الـ session فوق
    const { courseId, studentId } = session.metadata;

    try {
      // 🔥 التعديل هنا: بنحدث MongoDB بدل Firebase
      const updatedEnrollment = await Enrollment.findOneAndUpdate(
        { studentId: studentId, courseId: courseId }, // بندور بالاتنين دول
        { 
          status: "active", // بنخلي الحالة active عشان يقدر يدخل الكورس
          progressPercentage: 0, // لسه بيبدأ
          // ممكن تخزن الـ paymentId بتاع Stripe برضه لو عايز
          $set: { updatedAt: new Date() } 
        },
        { upsert: true, new: true } // لو مش موجود هيكريته، ولو موجود هيحدثه (أضمن)
      );

      if (updatedEnrollment) {
        console.log(`✅ MongoDB: Student ${studentId} is now active in course ${courseId}`);
      }
      
    } catch (error) {
      console.error("❌ MongoDB Update Error:", error);
    }
  }

  res.json({ received: true });
};