/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "website-weight",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        cloudflare: "5.40.1",
        aws: "6.56.0"
      },
    };
  },
  async run() {
    // -------------------------------------------------------------
    // --------------------- Stage v. Prod -------------------------
    // -------------------------------------------------------------

    // Set the subdomain based on the stage
    const domainName = $app.stage === "production"
      ? "websiteweight.com"
      : `${$app.stage}.websiteweight.com"`;

    // -------------------------------------------------------------
    // ---------------------- SECRETS SETUP ------------------------
    // -------------------------------------------------------------
    const supabaseServiceRoleKey = new sst.Secret("SupabaseServiceRoleKey", "my-secret-placeholder-value");
    // const resendAPIKey = new sst.Secret("ResendAPIKey", "my-secret-placeholder-value");
    // const stripePublicKey = new sst.Secret("StripePublicKey", "my-secret-placeholder-value");
    // const stripeSecretKey = new sst.Secret("StripeSecretKey", "my-secret-placeholder-value");
    // const stripeWebhookSecret = new sst.Secret("StripeWebhookSecret", "my-secret-placeholder-value");

    // -------------------------------------------------------------
    // ------------------- NEXT.JS FRONTEND ------------------------
    // -------------------------------------------------------------

    const websiteWeightWebApp = new sst.aws.Nextjs("WebsiteWeightWebApp", {
      link: [
        supabaseServiceRoleKey,
      ],
      domain: {
        name: domainName,
        redirects: ["www." + domainName],
        dns: sst.cloudflare.dns()
      },
      environment: {
        // STAGE: $app.stage,
        ENVIRONMENT: "production",
        NEXT_PUBLIC_POSTHOG_KEY: 'phc_3NEdMf34RjV6vG78Kj5FidWqmT6yR1ujg0YISYZt06v',
        NEXT_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com',
      },
    });
  },
});
