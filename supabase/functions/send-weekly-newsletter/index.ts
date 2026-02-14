// GoodWatch Weekly Newsletter Sender
// Supabase Edge Function
// Sends the weekly digest to all active subscribers via Resend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-newsletter-secret",
};

// Platform display names and colors
const PLATFORM_CONFIG: Record<
  string,
  { name: string; color: string; logo: string }
> = {
  netflix: { name: "Netflix", color: "#E50914", logo: "N" },
  prime: { name: "Prime Video", color: "#00A8E1", logo: "P" },
  jiohotstar: { name: "JioHotstar", color: "#0A0A0A", logo: "H" },
  sonyliv: { name: "SonyLIV", color: "#000000", logo: "S" },
  zee5: { name: "Zee5", color: "#8230C6", logo: "Z" },
  jiocinema: { name: "JioCinema", color: "#E50071", logo: "J" },
  appletv: { name: "Apple TV+", color: "#000000", logo: "A" },
};

interface DigestMovie {
  title: string;
  year: number;
  rating: number;
  runtime: string;
  poster_url: string | null;
  mood_tag: string | null;
  genres: string[];
}

interface WeeklyDigest {
  week_of: string;
  week_start: string;
  week_end: string;
  platforms: Record<string, DigestMovie[]>;
  total_new_releases: number;
  total_quality_picks: number;
  generated_at: string;
}

interface Subscriber {
  id: string;
  email: string;
  unsubscribe_token: string;
}

function generateEmailHTML(
  digest: WeeklyDigest,
  unsubscribeUrl: string
): string {
  const platformSections = Object.entries(digest.platforms)
    .map(([platform, movies]) => {
      const config = PLATFORM_CONFIG[platform] || {
        name: platform,
        color: "#D4AF37",
        logo: "?",
      };

      const movieCards = movies
        .map(
          (movie) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #262626;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="60" valign="top">
                  ${
                    movie.poster_url
                      ? `<img src="${movie.poster_url}" alt="${movie.title}" width="60" height="90" style="border-radius: 8px; display: block;" />`
                      : `<div style="width: 60px; height: 90px; background: #1C1C1E; border-radius: 8px;"></div>`
                  }
                </td>
                <td style="padding-left: 16px;" valign="top">
                  <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #ffffff;">${movie.title}</p>
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #8E8E93;">${movie.year} · ${movie.runtime}</p>
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="background: rgba(212, 175, 55, 0.15); padding: 4px 10px; border-radius: 12px;">
                        <span style="color: #D4AF37; font-size: 12px; font-weight: 600;">★ ${movie.rating.toFixed(1)}</span>
                      </td>
                      ${
                        movie.mood_tag
                          ? `
                      <td style="padding-left: 8px;">
                        <span style="background: #262626; padding: 4px 10px; border-radius: 12px; color: #8E8E93; font-size: 12px;">${movie.mood_tag}</span>
                      </td>
                      `
                          : ""
                      }
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `
        )
        .join("");

      return `
      <tr>
        <td style="padding: 24px 0 16px 0;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width: 32px; height: 32px; background: ${config.color}; border-radius: 8px; text-align: center; vertical-align: middle;">
                <span style="color: #ffffff; font-size: 14px; font-weight: 700;">${config.logo}</span>
              </td>
              <td style="padding-left: 12px;">
                <span style="color: #ffffff; font-size: 18px; font-weight: 600;">${config.name}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${movieCards}
    `;
    })
    .join("");

  // Get platform names for subject line
  const platformNames = Object.keys(digest.platforms)
    .slice(0, 3)
    .map((p) => PLATFORM_CONFIG[p]?.name || p)
    .join(", ");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>GoodWatch Weekly - ${digest.week_of}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <!-- Wrapper -->
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- Container -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 480px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px; text-align: center;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <!-- Logo -->
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width: 40px; height: 40px; background: linear-gradient(180deg, #D4AF37 0%, #C9A227 100%); border-radius: 10px; text-align: center; vertical-align: middle;">
                          <span style="color: #0a0a0a; font-size: 18px; font-weight: 700;">G</span>
                        </td>
                        <td style="padding-left: 10px;">
                          <span style="background: linear-gradient(180deg, #D4AF37 0%, #C9A227 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 22px; font-weight: 700;">GoodWatch</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding: 32px 24px; background: linear-gradient(180deg, #1C1C1E 0%, #141414 100%); border-radius: 20px; border: 1px solid #262626;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 14px; color: #8E8E93; text-transform: uppercase; letter-spacing: 1px;">This Week's Drops</p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding-bottom: 8px;">
                    <p style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff;">${digest.week_of}</p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0; font-size: 16px; color: #8E8E93;">
                      <span style="color: #D4AF37; font-weight: 600;">${digest.total_quality_picks}</span> quality picks from <span style="color: #D4AF37; font-weight: 600;">${digest.total_new_releases}</span> new releases
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Platform Sections -->
          <tr>
            <td style="padding: 16px 0;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                ${platformSections}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 32px 0; text-align: center;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 16px; text-align: center;">
                    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff;">Want personalized picks?</p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #8E8E93;">GoodWatch app coming soon to App Store!</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0; border-top: 1px solid #262626; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #525252;">
                You're receiving this because you subscribed at goodwatch.movie
              </p>
              <p style="margin: 0; font-size: 12px; color: #525252;">
                <a href="${unsubscribeUrl}" style="color: #8E8E93; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

function generateSubjectLine(digest: WeeklyDigest): string {
  const platformNames = Object.keys(digest.platforms)
    .slice(0, 2)
    .map((p) => PLATFORM_CONFIG[p]?.name || p)
    .join(", ");

  const morePlatforms =
    Object.keys(digest.platforms).length > 2 ? " & more" : "";

  return `This week on ${platformNames}${morePlatforms}: ${digest.total_quality_picks} quality drops`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication - accept either newsletter secret OR service role key
    const newsletterSecret = Deno.env.get("NEWSLETTER_SECRET");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const providedSecret = req.headers.get("x-newsletter-secret");
    const authHeader = req.headers.get("authorization");

    // Check if authenticated via newsletter secret
    const validNewsletterSecret = newsletterSecret && providedSecret === newsletterSecret;

    // Check if authenticated via service role key (for pg_cron calls)
    const validServiceRole = serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;

    if (!validNewsletterSecret && !validServiceRole) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Generate digest
    console.log("Generating weekly digest...");

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Call the digest function directly or fetch from endpoint
    const { data: releases, error: releasesError } = await supabase.rpc(
      "get_weekly_releases",
      {
        start_date: startDateStr,
        end_date: endDateStr,
      }
    );

    if (releasesError) {
      throw new Error(`Failed to fetch releases: ${releasesError.message}`);
    }

    // Apply quality gates and build digest
    const qualityReleases = (releases || []).filter(
      (movie: any) =>
        movie.rating >= 6.5 &&
        movie.vote_count >= 500 &&
        movie.mood_tags &&
        movie.mood_tags.length > 0
    );

    const platformGroups: Record<string, DigestMovie[]> = {};

    for (const movie of qualityReleases) {
      const platform = movie.platform;
      if (!platformGroups[platform]) {
        platformGroups[platform] = [];
      }
      if (platformGroups[platform].length < 3) {
        const hours = Math.floor(movie.runtime_minutes / 60);
        const mins = movie.runtime_minutes % 60;
        const runtime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

        // Get primary mood tag
        let moodTag = null;
        if (movie.mood_tags && movie.mood_tags.length > 0) {
          moodTag = movie.mood_tags[0]
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
        }

        platformGroups[platform].push({
          title: movie.title,
          year: movie.year,
          rating: movie.rating,
          runtime,
          poster_url: movie.poster_url,
          mood_tag: moodTag,
          genres: movie.genres || [],
        });
      }
    }

    const formatDateRange = (start: Date, end: Date): string => {
      const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
      const startStr = start.toLocaleDateString("en-US", options);
      const endStr = end.toLocaleDateString("en-US", { ...options, year: "numeric" });
      return `${startStr} - ${endStr}`;
    };

    const digest: WeeklyDigest = {
      week_of: formatDateRange(startDate, endDate),
      week_start: startDateStr,
      week_end: endDateStr,
      platforms: platformGroups,
      total_new_releases: (releases || []).length,
      total_quality_picks: Object.values(platformGroups).reduce(
        (sum, movies) => sum + movies.length,
        0
      ),
      generated_at: new Date().toISOString(),
    };

    // Check if there's content to send
    if (digest.total_quality_picks === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No quality releases this week, newsletter not sent",
          digest,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check for test mode (single email)
    let testEmail: string | null = null;
    try {
      const body = await req.json();
      testEmail = body.test_email || null;
    } catch {
      // No body or invalid JSON, continue normally
    }

    // Step 2: Get subscribers (or use test email)
    let activeSubscribers: Subscriber[] = [];

    if (testEmail) {
      console.log(`Test mode: sending to ${testEmail}`);
      activeSubscribers = [{
        id: "test",
        email: testEmail,
        unsubscribe_token: "test-token",
      }];
    } else {
      console.log("Fetching active subscribers...");

      const { data: subscribers, error: subscribersError } = await supabase
        .from("newsletter_subscribers")
        .select("id, email, unsubscribe_token")
        .is("unsubscribed_at", null);

      if (subscribersError) {
        throw new Error(`Failed to fetch subscribers: ${subscribersError.message}`);
      }

      activeSubscribers = subscribers || [];

      if (activeSubscribers.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "No active subscribers",
            digest,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    console.log(`Sending to ${activeSubscribers.length} subscribers...`);

    // Step 3: Send emails via Resend
    const subjectLine = generateSubjectLine(digest);
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const subscriber of activeSubscribers) {
      const unsubscribeUrl = `https://goodwatch.movie/unsubscribe.html?token=${subscriber.unsubscribe_token}`;
      const emailHtml = generateEmailHTML(digest, unsubscribeUrl);

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "GoodWatch <newsletter@goodwatch.movie>",
            to: subscriber.email,
            subject: subjectLine,
            html: emailHtml,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          const errorData = await response.json();
          failCount++;
          errors.push(`${subscriber.email}: ${JSON.stringify(errorData)}`);
        }
      } catch (error) {
        failCount++;
        errors.push(`${subscriber.email}: ${error.message}`);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Step 4: Log send
    const sendStatus =
      failCount === 0 ? "success" : successCount === 0 ? "failed" : "partial";

    const { error: logError } = await supabase.from("newsletter_sends").insert({
      week_start: startDateStr,
      week_end: endDateStr,
      subscriber_count: activeSubscribers.length,
      successful_sends: successCount,
      failed_sends: failCount,
      status: sendStatus,
      error_log: errors.length > 0 ? errors.join("\n") : null,
      digest_data: digest,
    });

    if (logError) {
      console.error("Failed to log send:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: sendStatus,
        subscriber_count: activeSubscribers.length,
        successful_sends: successCount,
        failed_sends: failCount,
        subject: subjectLine,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Newsletter send error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to send newsletter",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
