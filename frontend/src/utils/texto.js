export const repararTexto = (texto) => {
  if (texto === null || texto === undefined) return "";

  return String(texto)
    .replaceAll("D\u00C3\u0192\u00C2\u00A9bito", "D\u00E9bito")
    .replaceAll("Cr\u00C3\u0192\u00C2\u00A9dito", "Cr\u00E9dito")
    .replaceAll("Autom\u00C3\u0192\u00C2\u00A1tico", "Autom\u00E1tico")
    .replaceAll("Categor\u00C3\u0192\u00C2\u00ADa", "Categor\u00EDa")
    .replaceAll("Descripci\u00C3\u0192\u00C2\u00B3n", "Descripci\u00F3n")
    .replaceAll("Hist\u00C3\u0192\u00C2\u00B3rico", "Hist\u00F3rico")
    .replaceAll("Alimentaci\u00C3\u0192\u00C2\u00B3n", "Alimentaci\u00F3n")
    .replaceAll("Educaci\u00C3\u0192\u00C2\u00B3n", "Educaci\u00F3n")
    .replaceAll("Prestaci\u00C3\u0192\u00C2\u00B3n", "Prestaci\u00F3n")
    .replaceAll("D\u00C3\u00A9bito", "D\u00E9bito")
    .replaceAll("Cr\u00C3\u00A9dito", "Cr\u00E9dito")
    .replaceAll("Autom\u00C3\u00A1tico", "Autom\u00E1tico")
    .replaceAll("Categor\u00C3\u00ADa", "Categor\u00EDa")
    .replaceAll("Descripci\u00C3\u00B3n", "Descripci\u00F3n")
    .replaceAll("Hist\u00C3\u00B3rico", "Hist\u00F3rico")
    .replaceAll("Alimentaci\u00C3\u00B3n", "Alimentaci\u00F3n")
    .replaceAll("Educaci\u00C3\u00B3n", "Educaci\u00F3n")
    .replaceAll("Prestaci\u00C3\u00B3n", "Prestaci\u00F3n")
    .replaceAll("\u00C3\u00AD", "\u00ED")
    .replaceAll("\u00C3\u00A1", "\u00E1")
    .replaceAll("\u00C3\u00A9", "\u00E9")
    .replaceAll("\u00C3\u00B3", "\u00F3")
    .replaceAll("\u00C3\u00BA", "\u00FA")
    .replaceAll("\u00C3\u00B1", "\u00F1")
    .replaceAll("\u00C2\u00BF", "\u00BF")
    .replaceAll("\u00C2\u00A1", "\u00A1")
    .replaceAll("\u00C2\u00B0", "\u00B0");
};

export const repararCategoriaGasto = (texto) => {
  const corregido = repararTexto(texto);
  return corregido.trim().toLowerCase() === "otros ingresos"
    ? "Otros gastos"
    : corregido;
};
