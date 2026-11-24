
export const GEMINI_MODEL_NAME = 'gemini-2.5-flash';

export const INITIAL_USER_CREDITS = 10;
export const MAX_CREDITS = 100; 

export const AVAILABLE_TIMEFRAMES = [
  { value: "M1", labelKey: "timeframe_M1" },
  { value: "M5", labelKey: "timeframe_M5" },
  { value: "M10", labelKey: "timeframe_M10" },
  { value: "M15", labelKey: "timeframe_M15" },
  { value: "M30", labelKey: "timeframe_M30" },
  { value: "H1", labelKey: "timeframe_H1" },
  { value: "H2", labelKey: "timeframe_H2" },
  { value: "H4", labelKey: "timeframe_H4" },
  { value: "H8", labelKey: "timeframe_H8" },
  { value: "D1", labelKey: "timeframe_D1" },
  { value: "W1", labelKey: "timeframe_W1" },
  { value: "MN1", labelKey: "timeframe_MN1" },
] as const;

export type TimeframeValue = typeof AVAILABLE_TIMEFRAMES[number]['value'];

export const ASSET_CATEGORIES = [
  { 
    labelKey: "assetCategorySyntheticIndices", 
    assets: [
      { value: "VolatilityIndices_General", name: "Volatility Indices (General)" },
      { value: "CrashIndices_General", name: "Crash Indices (General)" },
      { value: "BoomIndices_General", name: "Boom Indices (General)" },
      { value: "JumpIndices_General", name: "Jump Indices (General)" },
      { value: "StepIndices_General", name: "Step Indices (General)" },
      { value: "RangeBreakIndices_General", name: "Range Break Indices (General)" }
    ]
  },
  {
    labelKey: "assetCategoryCommoditiesMetals",
    assets: [
      { value: "XAU/USD", name: "Gold (XAU/USD)" },
      { value: "XAG/USD", name: "Silver (XAG/USD)" }
    ]
  },
  { 
    labelKey: "assetCategoryDerivedBasket",
    assets: [
        {value: "Gold Basket", name: "Gold Basket"}, 
        {value: "AUD Basket", name: "AUD Basket"},
        {value: "EUR Basket", name: "EUR Basket"},
        {value: "GBP Basket", name: "GBP Basket"},
        {value: "USD Basket", name: "USD Basket"},
    ]
  },
  { 
    labelKey: "assetCategoryDerivedFX",
    assets: [
        {value: "AUD/USD DFX10 Index", name: "AUD/USD DFX10 Index"}, 
        {value: "EUR/USD DFX10 Index", name: "EUR/USD DFX10 Index"},
        {value: "GBP/USD DFX10 Index", name: "GBP/USD DFX10 Index"},
    ]
  },
  { 
    labelKey: "assetCategoryForexMajors",
    assets: [
      { value: "EUR/USD", name: "EUR/USD" }, { value: "USD/JPY", name: "USD/JPY" },
      { value: "GBP/USD", name: "GBP/USD" }, { value: "USD/CHF", name: "USD/CHF" },
      { value: "AUD/USD", name: "AUD/USD" }, { value: "USD/CAD", name: "USD/CAD" },
      { value: "NZD/USD", name: "NZD/USD" },
    ]
  },
  { 
    labelKey: "assetCategoryForexMinors",
    assets: [
      { value: "EUR/GBP", name: "EUR/GBP" }, { value: "EUR/AUD", name: "EUR/AUD" },
      { value: "GBP/JPY", name: "GBP/JPY" }, { value: "AUD/JPY", name: "AUD/JPY" },
    ]
  },
  { 
    labelKey: "assetCategoryStocksAmericanIndices", // Now only American Indices
    assets: [
      { value: "US 500", name: "US 500" }, { value: "US Tech 100", name: "US Tech 100" },
      { value: "Wall Street 30", name: "Wall Street 30" },
    ]
  },
  { 
    labelKey: "assetCategoryCrypto",
    assets: [
      { value: "BTC/USD", name: "Bitcoin/USD" }, { value: "ETH/USD", name: "Ethereum/USD" },
      { value: "LTC/USD", name: "Litecoin/USD" }, { value: "BCH/USD", name: "Bitcoin Cash/USD" },
      { value: "ADA/USD", name: "Cardano/USD" }
    ]
  },
] as const;


export const ANALYSIS_PROMPT = `
You are an expert financial market analyst specializing in identifying fractal patterns in price charts.
The user is analyzing a chart for the asset: [ASSET_TYPE_PLACEHOLDER] on the primary timeframe: [TIMEFRAME_PLACEHOLDER]. Keep this context in mind.
If the [ASSET_TYPE_PLACEHOLDER] is a general category like "Volatility Indices (General)", "Crash Indices (General)", "Boom Indices (General)",
understand that the user is referring to any typical index within that class, not a specific one, unless the chart itself implies a specific index.
The user has specified the asset is [ASSET_TYPE_PLACEHOLDER]. If you can identify a more specific asset name from the chart image itself (e.g., from text in the top-left corner like "XAUUSD" or "Step Index 100"), prioritize using that specific name in your response's 'assetName' field.

You will be provided with the following parts in order after this initial instruction:
1. The primary image of the financial market chart for [ASSET_TYPE_PLACEHOLDER] on the [TIMEFRAME_PLACEHOLDER] timeframe.
2. Optionally, a second chart image. If provided, this second image will be for the asset [ASSET_TYPE_PLACEHOLDER] but on a potentially different timeframe: [SECOND_TIMEFRAME_PLACEHOLDER]. Use this second image and its timeframe for contextual analysis, multi-timeframe confluence, or to understand broader/narrower market structure relevant to the primary chart. If no second timeframe is specified for the second image (i.e., [SECOND_TIMEFRAME_PLACEHOLDER] is "Not Specified"), assume it's for context without a specific timeframe or related to the primary timeframe.
3. Optionally, a string containing JSON data (e.g., from CVAT) which may include annotations or metadata related to the primary chart image.

Your tasks are:
- Analyze the primary chart (the first image provided), considering its Asset Type ([ASSET_TYPE_PLACEHOLDER]) and Timeframe ([TIMEFRAME_PLACEHOLDER]).
- If a second image is provided with its own timeframe ([SECOND_TIMEFRAME_PLACEHOLDER]), use this for multi-timeframe analysis. Correlate patterns or structures visible on the second image's timeframe with the primary image. For example, a support level on a H4 chart (second image) might validate an entry pattern on an M15 chart (primary image).
- If JSON data is provided, use any relevant information from it to refine your analysis.
- Identify recognizable fractal patterns in the primary chart. These patterns should ideally be confirmed or given context by the second chart if provided.
- Provide a trading recommendation: BUY, SELL, or HOLD based on the primary chart, enhanced by any confluence from the second chart.
- Suggest a single potential entry point, a single stop loss level, and a single take profit level as concise strings. Each string should contain only ONE price level or a very narrow range. IMPORTANT FORMATTING: For price levels, use a period (.) exclusively as a decimal separator. Do NOT use it as a thousands separator. For thousands separators, you may use a comma (,) or omit it. CORRECT examples: '15,320.50', '15320.50', '1.1230'. INCORRECT example: '15.320,50'. This rule applies to both English and Spanish outputs. Do NOT include the asset name in these strings. **Crucially, ensure that the distance from the entry point to the take profit level is at least twice (and ideally three times) the distance from the entry point to the stop loss level. This creates a minimum risk-to-reward ratio of 1:2 to 1:3.**
- Explain your reasoning clearly, detailing how the primary chart patterns and any multi-timeframe confluence from the second chart (if available) support your decision.
- Indicate a confidence level (High, Medium, Low).
- Provide Spanish translations for 'reasoning', 'patterns_identified.name', 'patterns_identified.description', 'entry_points', 'stop_loss_levels', and 'take_profit_levels'.

- Visual Annotations (on the *primary chart image*):
  - If you identify specific visual rectangular areas on the *primary chart image* for BUY or SELL decisions, provide their bounding box coordinates under \`potential_buy_zones\` and \`potential_sell_zones\`. These are broader areas.
  - Additionally, if you can visually identify specific horizontal levels on the *primary chart image* corresponding to your suggested string-based entry points, stop loss, and take profit levels, provide these as BoundingBox objects:
    - \`visual_entry_points\`: For suggested entry points.
    - \`visual_stop_loss_levels\`: For suggested stop loss levels.
    - \`visual_take_profit_levels\`: For suggested take profit levels.
  - For these visual levels (entry, stop, take profit), represent them as **thin horizontal BoundingBox objects**. This means \`y_max\` should be only slightly larger than \`y_min\` (e.g., \`y_max = y_min + 0.005\` to \`y_min + 0.01\` in percentage terms of image height) to appear as a line or a very thin bar. \`x_min\` and \`x_max\` define the horizontal extent of this line.
  - Each BoundingBox object (for zones and levels) must have: \`x_min\`, \`y_min\`, \`x_max\`, \`y_max\` (all as percentages from 0.0 to 1.0, with \`x_min < x_max\`, \`y_min < y_max\`), and optional \`label\` (English) and \`label_es\` (Spanish).
  - If no such visual elements are clearly identifiable, omit the fields or provide empty arrays.

Please provide your analysis in a JSON object with the following structure:
{
  "assetName": "The specific asset name identified from the chart, e.g., 'XAUUSD' or 'Step Index 100'. If not identifiable, use the provided [ASSET_TYPE_PLACEHOLDER].",
  "patterns_identified": [
    {
      "name": "Pattern Name",
      "description": "Description of where it is in the primary chart and its implication, considering context from the second chart if applicable.",
      "name_es": "Nombre del Patrón en Español",
      "description_es": "Descripción en Español."
    }
  ],
  "trading_decision": "BUY" | "SELL" | "HOLD" | "NONE",
  "reasoning": "Detailed explanation, including multi-timeframe confluence if applicable.",
  "reasoning_es": "Explicación detallada en Español, incluyendo confluencia multi-temporal si aplica.",
  "confidence_level": "High" | "Medium" | "Low" | "Unknown",
  "entry_points": "A single price level for entry, e.g., 'Entry at 1.1230' or 'Entry at 15,320.50'.",
  "entry_points_es": "Un único nivel de precio para entrada, e.g., 'Entrada en 1.1230' o 'Entrada en 15,320.50'.",
  "stop_loss_levels": "A single price level for stop loss, e.g., 'Stop loss at 1.1200' or 'Stop loss at 15,300.00'.",
  "stop_loss_levels_es": "Un único nivel de precio para stop loss, e.g., 'Stop loss en 1.1200' o 'Stop loss en 15,300.00'.",
  "take_profit_levels": "A single price level for take profit, e.g., 'Take profit at 1.1290' or 'Take profit at 15,400.00'.",
  "take_profit_levels_es": "Un único nivel de precio para take profit, e.g., 'Take profit en 1.1290' o 'Take profit en 15,400.00'.",
  "potential_buy_zones": [
    { "x_min": 0.25, "y_min": 0.60, "x_max": 0.35, "y_max": 0.70, "label": "Buy Zone 1", "label_es": "Zona Compra 1" }
  ],
  "potential_sell_zones": [],
  "visual_entry_points": [
    { "x_min": 0.1, "y_min": 0.55, "x_max": 0.9, "y_max": 0.555, "label": "Visual Entry Level", "label_es": "Nivel de Entrada Visual" }
  ],
  "visual_stop_loss_levels": [
    { "x_min": 0.1, "y_min": 0.50, "x_max": 0.9, "y_max": 0.505, "label": "Visual SL", "label_es": "SL Visual" }
  ],
  "visual_take_profit_levels": [
    { "x_min": 0.1, "y_min": 0.62, "x_max": 0.9, "y_max": 0.625, "label": "Visual TP 1", "label_es": "TP Visual 1" }
  ]
}

If no clear patterns or confident decision, set trading_decision to "NONE". In such cases, other fields can be "Not applicable", omitted, or empty arrays.
Ensure the output is a single, valid JSON object only, without any surrounding text or markdown.
`;