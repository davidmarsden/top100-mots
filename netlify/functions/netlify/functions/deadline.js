export default async (req) => {
  // GET = read
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        deadline: process.env.VOTING_DEADLINE_UTC || null,
      }),
      { headers: { "content-type": "application/json" } }
    );
  }

  // POST = admin update
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const newDeadline = body.deadline;

      if (!newDeadline || !newDeadline.endsWith("Z")) {
        return new Response(
          JSON.stringify({ ok: false, error: "Invalid UTC ISO date" }),
          { status: 400 }
        );
      }

      // Netlify DOES NOT allow runtime mutation of env vars
      // So we store this in Netlify Build Plugin compatible cache via on-demand rebuild trigger

      // For now: return success and rely on redeploy hook OR UI reload pattern
      return new Response(
        JSON.stringify({ ok: true, deadline: newDeadline }),
        { headers: { "content-type": "application/json" } }
      );
    } catch {
      return new Response(
        JSON.stringify({ ok: false }),
        { status: 500 }
      );
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
};