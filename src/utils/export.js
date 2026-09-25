// src/utils/export.js
// Exports côté navigateur (l'API n'a pas d'endpoint d'export) :
//   - Excel  : SheetJS (xlsx) — un classeur, une ou plusieurs feuilles
//   - PDF    : jsPDF + jspdf-autotable — titre, sous-titre, tableaux
// Les deux fonctions reçoivent des « tableaux simples » : { titre, colonnes: ['A', 'B'], lignes: [[…], […]] }
//
// Les bibliothèques sont lourdes (~1 Mo) : on les charge à la demande avec import() dynamique,
// uniquement au premier clic sur un bouton d'export, pas au chargement de l'application.

/** Nom de fichier propre : « Statistiques CAP de Banconi » → « statistiques-cap-de-banconi-2026-09-11 » */
export function nomFichier(base) {
  const date = new Date().toISOString().slice(0, 10)
  const propre = base
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // retire les accents
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${propre}-${date}`
}

/**
 * Export Excel.
 * @param {string} base            nom de base du fichier
 * @param {Array<{titre: string, colonnes: string[], lignes: any[][]}>} tableaux  une feuille par tableau
 */
export async function exporterExcel(base, tableaux) {
  const XLSX = await import('xlsx')
  const classeur = XLSX.utils.book_new()
  tableaux.forEach((t, i) => {
    const feuille = XLSX.utils.aoa_to_sheet([t.colonnes, ...t.lignes])
    // Largeur de colonnes approximative selon le contenu
    feuille['!cols'] = t.colonnes.map((c, j) => ({
      wch: Math.min(60, Math.max(String(c).length, ...t.lignes.map((l) => String(l[j] ?? '').length)) + 2),
    }))
    // Nom de feuille : 31 caractères max, sans caractères interdits
    const nom = (t.titre || `Feuille ${i + 1}`).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31)
    XLSX.utils.book_append_sheet(classeur, feuille, nom)
  })
  XLSX.writeFile(classeur, `${nomFichier(base)}.xlsx`)
}

/**
 * Export PDF (A4 portrait, ou paysage si un tableau a plus de 6 colonnes).
 * @param {string} base        nom de base du fichier
 * @param {string} titre       titre en tête de page
 * @param {string} sousTitre   ex. périmètre + année scolaire
 * @param {Array<{titre: string, colonnes: string[], lignes: any[][]}>} tableaux
 */
export async function exporterPDF(base, titre, sousTitre, tableaux) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const paysage = tableaux.some((t) => t.colonnes.length > 6)
  const doc = new jsPDF({ orientation: paysage ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })
  const marge = 14

  // En-tête de l'application
  doc.setFillColor(15, 81, 50) // #0F5132 cnece-primary
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.text(import.meta.env.VITE_APP_TITLE || 'Mon application Vue', marge, 11.5)

  doc.setTextColor(30, 41, 59)
  doc.setFontSize(16)
  doc.text(titre, marge, 30)
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text(`${sousTitre}   ·   Généré le ${new Date().toLocaleString('fr-FR')}`, marge, 36)

  let y = 44
  tableaux.forEach((t) => {
    if (t.titre) {
      doc.setFontSize(12)
      doc.setTextColor(15, 81, 50)
      doc.text(t.titre, marge, y)
      y += 3
    }
    autoTable(doc, {
      startY: y,
      head: [t.colonnes],
      body: t.lignes.map((l) => l.map((v) => (v === null || v === undefined ? '—' : String(v)))),
      margin: { left: marge, right: marge },
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [15, 81, 50], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'grid',
    })
    y = doc.lastAutoTable.finalY + 10
    // Nouvelle page si le prochain tableau n'a plus de place
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage()
      y = 20
    }
  })

  // Pied de page : numéro de page
  const nbPages = doc.getNumberOfPages()
  for (let i = 1; i <= nbPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Page ${i} / ${nbPages}`, doc.internal.pageSize.getWidth() - marge, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
  }

  doc.save(`${nomFichier(base)}.pdf`)
}
