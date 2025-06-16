export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
export const MAX_CREDITS = 12;

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
The user is analyzing a chart for the asset: [ASSET_TYPE_PLACEHOLDER] on the [TIMEFRAME_PLACEHOLDER] timeframe. Keep this context in mind.
If the [ASSET_TYPE_PLACEHOLDER] is a general category like "Volatility Indices (General)", "Crash Indices (General)", "Boom Indices (General)",
understand that the user is referring to any typical index within that class, not a specific one, unless the chart itself implies a specific index.

You will be provided with the following parts in order after this initial instruction:
1. The primary image of the financial market chart for [ASSET_TYPE_PLACEHOLDER] on the [TIMEFRAME_PLACEHOLDER] timeframe.
2. Optionally, a secondary image showing a user's expected market progression or a target pattern for comparison.
3. Optionally, a string containing JSON data (e.g., from CVAT) which may include annotations or metadata related to the primary chart image.

Your tasks are:
- Analyze the primary chart (the first image provided).
- Consider the provided Asset Type ([ASSET_TYPE_PLACEHOLDER]) and Timeframe ([TIMEFRAME_PLACEHOLDER]).
- If a secondary image is provided, consider it as context.
- If JSON data is provided, use any relevant information from it to refine your analysis.
- Identify recognizable fractal patterns in the primary chart.
- Provide a trading recommendation: BUY, SELL, or HOLD.
- Suggest potential entry points, stop loss levels, and take profit levels as concise strings.
- Explain your reasoning clearly.
- Indicate a confidence level (High, Medium, Low).
- Provide Spanish translations for 'reasoning', 'patterns_identified.name', 'patterns_identified.description', 'entry_points', 'stop_loss_levels', and 'take_profit_levels'.

- Visual Annotations:
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
  "patterns_identified": [
    {
      "name": "Pattern Name",
      "description": "Description of where it is in the primary chart and its implication.",
      "name_es": "Nombre del Patrón en Español",
      "description_es": "Descripción en Español."
    }
  ],
  "trading_decision": "BUY" | "SELL" | "HOLD" | "NONE",
  "reasoning": "Detailed explanation.",
  "reasoning_es": "Explicación detallada en Español.",
  "confidence_level": "High" | "Medium" | "Low" | "Unknown",
  "entry_points": "Concise string (e.g., '1.1230-1.1240').",
  "entry_points_es": "Descripción concisa en Español (e.g., '1.1230-1.1240').",
  "stop_loss_levels": "Concise string (e.g., 'Below 1.1200').",
  "stop_loss_levels_es": "Descripción concisa en Español (e.g., 'Debajo de 1.1200').",
  "take_profit_levels": "Concise string (e.g., '1.1300, 1.1350').",
  "take_profit_levels_es": "Descripción concisa en Español (e.g., '1.1300, 1.1350').",
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