module.exports = function handler(req, res) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return res.status(500).json({
      ok: false,
      error: "Supabase environment variables are missing."
    });
  }

  res.status(200).json({
    ok: true,
    supabaseUrl: url,
    supabaseAnonKey: anonKey
  });
};
