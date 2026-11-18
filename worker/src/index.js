/**
 * AllLookDifferent Leaderboard API
 * Cloudflare Worker + KV Storage
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    try {
      // GET /leaderboard - Fetch top scores
      if (request.method === 'GET' && url.pathname === '/leaderboard') {
        const leaderboard = await env.LEADERBOARD.get('scores', 'json') || [];
        return Response.json(leaderboard, { headers: CORS_HEADERS });
      }

      // POST /leaderboard - Submit a score
      if (request.method === 'POST' && url.pathname === '/leaderboard') {
        const { name, score } = await request.json();

        // Validation
        if (!name || typeof name !== 'string') {
          return Response.json(
            { error: 'Name is required' },
            { status: 400, headers: CORS_HEADERS }
          );
        }

        const maxScore = parseInt(env.MAX_SCORE) || 18;
        if (typeof score !== 'number' || score < 0 || score > maxScore) {
          return Response.json(
            { error: `Score must be between 0 and ${maxScore}` },
            { status: 400, headers: CORS_HEADERS }
          );
        }

        // Sanitize name (max 20 chars, alphanumeric + spaces)
        const sanitizedName = name.slice(0, 20).replace(/[^a-zA-Z0-9 ]/g, '');

        if (!sanitizedName.trim()) {
          return Response.json(
            { error: 'Invalid name' },
            { status: 400, headers: CORS_HEADERS }
          );
        }

        // Get current leaderboard
        const leaderboard = await env.LEADERBOARD.get('scores', 'json') || [];

        // Add new entry
        const entry = {
          name: sanitizedName.trim(),
          score: Math.floor(score),
          date: Date.now(),
        };
        leaderboard.push(entry);

        // Sort by score (desc), then by date (earlier first for ties)
        leaderboard.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.date - b.date;
        });

        // Keep only top N entries
        const maxEntries = parseInt(env.MAX_ENTRIES) || 50;
        const trimmed = leaderboard.slice(0, maxEntries);

        // Save back to KV
        await env.LEADERBOARD.put('scores', JSON.stringify(trimmed));

        // Find rank of new entry
        const rank = trimmed.findIndex(
          e => e.name === entry.name && e.date === entry.date
        ) + 1;

        return Response.json(
          { success: true, rank, entry },
          { headers: CORS_HEADERS }
        );
      }

      // 404 for unknown routes
      return Response.json(
        { error: 'Not found' },
        { status: 404, headers: CORS_HEADERS }
      );

    } catch (err) {
      return Response.json(
        { error: 'Internal server error' },
        { status: 500, headers: CORS_HEADERS }
      );
    }
  },
};
