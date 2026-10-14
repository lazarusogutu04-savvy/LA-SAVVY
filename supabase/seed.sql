-- Default settings. Payment values stay empty => clients see "Will be provided later".
insert into public.settings (key, value) values
('payment_config', '{"updatedAt":null,"updatedBy":null,"methods":[
  {"key":"mpesa_stk","label":"M-Pesa STK Push","fieldLabel":"Business Shortcode","enabled":true,"value":""},
  {"key":"mpesa_paybill","label":"Paybill Number","fieldLabel":"Paybill Number","enabled":true,"value":""},
  {"key":"paypal","label":"PayPal","fieldLabel":"PayPal Email","enabled":false,"value":""},
  {"key":"card","label":"Card (Visa / Mastercard)","fieldLabel":"Card API Keys","enabled":true,"value":"","secret":true,"configured":false}]}'),
('fair_cap', '{"ethicalMode":true,"capEnabled":true,"capFactor":0.85,"benchmarkKm":22}'),
('competitor_benchmarks', '[{"name":"Glovo","minKes":350,"maxKes":450},{"name":"Uber","minKes":380,"maxKes":480},{"name":"Bolt","minKes":250,"maxKes":350}]'),
('payment_secrets', '{}')
on conflict (key) do nothing;
-- pricing_config is omitted on purpose: the app falls back to DEFAULT_PRICING (80 / 12 / 1) until edited.
