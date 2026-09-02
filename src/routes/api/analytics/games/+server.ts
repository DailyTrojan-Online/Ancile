import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export async function POST({ request, locals: { supabase }, getClientAddress }) {
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ipAddress = getClientAddress();
  const { url, game, event, error: err, data } = await request.json();
  const { error } = await supabase
    .from("analytics")
    .insert([
      {
        url,
        user_agent: userAgent,
        user_ip: ipAddress,
        type: "game",
        data: { game, event, error: err, ...data },
      },
    ]);
  if (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }

  return json({ success: true });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
