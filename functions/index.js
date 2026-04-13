const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.ping = functions.https.onCall((data, context) => {
  return { message: "Firebase funcionando ✅" };
});

// Example IA function (placeholder as requested in prompt)
exports.generateAI = functions.https.onCall(async (data, context) => {
  // Logic would go here
  return { text: "IA Response Placeholder" };
});
