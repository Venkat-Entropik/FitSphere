import { env } from '@/config/env';

export interface LegalSection {
  heading: string;
  /** Paragraphs. Lines starting with "• " render as bullet points. */
  body: string[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const UPDATED = '15 November 2026';

const contact: LegalSection = {
  heading: 'Contact',
  body: env.supportEmail
    ? [`Questions or requests about your data: ${env.supportEmail}.`]
    : [
        'Questions or requests about your data: use the contact details on this app’s store listing.',
      ],
};

/**
 * Describes what the app actually does with data. If the app changes (new services, new data),
 * update this text in the same change. Have it reviewed before launch.
 */
export const PRIVACY_POLICY: LegalDocument = {
  title: 'Privacy Policy',
  updated: UPDATED,
  intro:
    'FitSphere helps you plan training, log workouts, runs, meals and weight, and get coaching suggestions. This page explains what we collect, why, and the choices you have.',
  sections: [
    {
      heading: 'What we collect',
      body: [
        '• Account: your name, email address and a password. Your password is stored only as a salted hash; we cannot read it.',
        '• Profile: goal, sex, age, height, weight, target weight, experience and training days per week.',
        '• Training: workouts (exercises, sets, weights, reps), runs and other activities, including the GPS route points you record, distance, time and estimated calories.',
        '• Body: weigh-ins, and body fat and muscle mass if you enter them.',
        '• Nutrition: meals, calories, macros and water you log, and food searches you make.',
        '• Coach: the questions you send and the replies you receive.',
        '• Technical: your IP address in server logs and for abuse limits, and error details when something fails. We do not put advertising or analytics trackers in the app.',
      ],
    },
    {
      heading: 'Location, camera and photos',
      body: [
        'Location is used only while you record a run, walk or ride, and only after you allow it. The route is saved to your account with that activity.',
        'The camera is used for progress photos and for scanning food barcodes. Progress photos stay on your device and are not uploaded.',
        'You can withdraw any permission in your device settings at any time.',
      ],
    },
    {
      heading: 'How we use your data',
      body: [
        'To run the app: show your history and progress, calculate targets, sync your data between this device and your account, and let you sign in and reset your password.',
        'To give coaching suggestions. We do not sell your data and we do not use it for advertising.',
      ],
    },
    {
      heading: 'The AI coach',
      body: [
        'When the AI coach is turned on, a summary of your recent training numbers (not your name or email) and the message you type are sent to Google’s Gemini service to write a reply. When it is off, or if it is unavailable, replies are written by built-in rules on our server.',
        'Please do not type health records, diagnoses or other sensitive personal details into the coach.',
      ],
    },
    {
      heading: 'Who else handles your data',
      body: [
        'We use these service providers to run FitSphere:',
        '• Hosting for our server and a managed PostgreSQL database that stores your account data.',
        '• An email service that sends password-reset codes. It receives your email address and the message.',
        '• Google (Gemini) for AI coach replies, as described above.',
        '• Open Food Facts, a public food database, when you search for foods or scan a barcode. It receives your search text or the barcode number, not your account.',
        '• YouTube, which plays exercise videos. When you play one, YouTube may collect data under its own policy.',
      ],
    },
    {
      heading: 'Storage and security',
      body: [
        'Data is sent over encrypted connections. Sign-in tokens are kept in your device’s secure storage. To work offline, a copy of your data is also kept on your device; it is removed when you delete your account or sign out of a different account.',
        'No system is perfectly secure, but we limit what we collect and protect it with industry-standard measures.',
      ],
    },
    {
      heading: 'Keeping and deleting your data',
      body: [
        'We keep your data while your account exists. In the app, open Profile and choose Delete account to erase your account and everything in it. Short-lived backups may remain for a limited time before they expire.',
        'You can also export your workouts, runs and weights from Profile, and edit your profile at any time.',
      ],
    },
    {
      heading: 'Your rights',
      body: [
        'Depending on where you live, you may have the right to access, correct, export or delete your data, and to object to or restrict some processing. Most of this is available in the app; for anything else, contact us.',
      ],
    },
    {
      heading: 'Children',
      body: [
        'FitSphere is not intended for anyone under 16, and we do not knowingly collect their data.',
      ],
    },
    {
      heading: 'Not medical advice',
      body: [
        'FitSphere gives general fitness information, not medical advice. Talk to a doctor before starting an exercise or nutrition programme, especially if you have a health condition.',
      ],
    },
    {
      heading: 'Changes to this policy',
      body: [
        'If we change this policy in a meaningful way, we will update the date above and tell you in the app.',
      ],
    },
    contact,
  ],
};

export const TERMS_OF_SERVICE: LegalDocument = {
  title: 'Terms of Service',
  updated: UPDATED,
  intro:
    'By creating an account or using FitSphere you agree to these terms. If you do not agree, please do not use the app.',
  sections: [
    {
      heading: 'Your account',
      body: [
        'You must be at least 16. Give accurate information, keep your password private, and tell us if you think someone else has access. You are responsible for activity under your account.',
      ],
    },
    {
      heading: 'Health and safety',
      body: [
        'FitSphere provides general fitness and nutrition information. It is not medical advice and does not replace a doctor, physiotherapist or dietitian. Targets, calorie figures, recovery scores and coach suggestions are estimates.',
        'Exercise carries risk. Check with a doctor before you start, use equipment and weights you can control, and stop if you feel pain, dizziness or unwell. You use the app and follow any suggestion at your own risk.',
      ],
    },
    {
      heading: 'Acceptable use',
      body: [
        'Do not misuse the service: no attempts to break, overload or reverse-engineer it, access other people’s data, or use it for anything unlawful. Do not use the coach to generate harmful content.',
      ],
    },
    {
      heading: 'Your data',
      body: [
        'You own what you log. You give us permission to store and process it to run the app, as described in the Privacy Policy. You can export or delete it at any time in the app.',
      ],
    },
    {
      heading: 'Third-party content',
      body: [
        'Exercise videos are provided by YouTube and belong to their creators. Food information comes from Open Food Facts and may be incomplete or wrong; check labels for allergens and accuracy.',
      ],
    },
    {
      heading: 'Availability and changes',
      body: [
        'We aim to keep FitSphere running but provide it “as is”, without promises of uninterrupted or error-free service. We may change, limit or stop features. The app keeps working offline from a copy on your device, but changes only reach your account when you are online.',
      ],
    },
    {
      heading: 'Ending your use',
      body: [
        'You can delete your account in the app at any time. We may suspend or close accounts that break these terms or put the service at risk.',
      ],
    },
    {
      heading: 'Limits on our liability',
      body: [
        'To the fullest extent the law allows, we are not liable for indirect or consequential losses, or for injury or loss resulting from exercise or from relying on the app’s estimates. Nothing here limits rights you have by law that cannot be limited.',
      ],
    },
    {
      heading: 'Changes to these terms',
      body: [
        'If we make a meaningful change, we will update the date above and tell you in the app. Continuing to use FitSphere means you accept the new terms.',
      ],
    },
    contact,
  ],
};
