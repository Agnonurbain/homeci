// ─────────────────────────────────────────────────────────────────────────────
// Référentiel géographique de la Côte d'Ivoire
// District → Région → Département → Ville → Communes → Quartiers
// ─────────────────────────────────────────────────────────────────────────────

export const REGIONS_BY_DISTRICT: Record<string, string[]> = {
  "District Autonome d'Abidjan": ["Abidjan"],
  "District Autonome de Yamoussoukro": ["Yamoussoukro"],
  "Lagunes": ["Grands-Ponts", "La Mé", "Agnéby-Tiassa"],
  "Lacs": ["Bélier", "Moronou", "N'Zi", "Iffou"],
  "Zanzan": ["Bounkani", "Gontougo"],
  "Comoé": ["Sud-Comoé", "Indénié-Djuablin"],
  "Vallée du Bandama": ["Gbêkê", "Hambol", "Marahoué"],
  "Woroba": ["Bafing", "Béré", "Worodougou"],
  "Bas-Sassandra": ["Gbôklé", "Gnôkwé", "San-Pédro"],
  "Montagnes": ["Tonkpi", "Guémon"],
  "Savanes": ["Poro", "Tchologo", "Bagoué"],
  "Denguélé": ["Folon", "Kabadougou"],
  "Gôh-Djiboua": ["Gôh", "Lôh-Djiboua"],
};

export const DEPARTEMENTS_BY_REGION: Record<string, string[]> = {
  "Abidjan": ["Abidjan"],
  "Yamoussoukro": ["Yamoussoukro", "Attiégouakro"],
  "Grands-Ponts": ["Dabou", "Jacqueville", "Grand-Lahou"],
  "La Mé": ["Adzopé", "Alépé"],
  "Agnéby-Tiassa": ["Agboville", "Tiassalé", "Sikensi"],
  "Bélier": ["Dimbokro", "Bocanda"],
  "Moronou": ["Bongouanou", "M'Batto"],
  "N'Zi": ["Dimbokro"],
  "Iffou": ["Daoukro", "Prikro"],
  "Bounkani": ["Bouna", "Doropo", "Nassian"],
  "Gontougo": ["Bondoukou", "Koun-Fao", "Tanda"],
  "Sud-Comoé": ["Aboisso", "Grand-Bassam", "Adiaké"],
  "Indénié-Djuablin": ["Abengourou", "Agnibilékrou"],
  "Gbêkê": ["Bouaké", "Béoumi", "Botro"],
  "Hambol": ["Katiola", "Niakaramandougou"],
  "Marahoué": ["Daloa", "Issia", "Vavoua"],
  "Bafing": ["Touba"],
  "Béré": ["Mankono"],
  "Worodougou": ["Séguéla"],
  "Gbôklé": ["Sassandra"],
  "Gnôkwé": ["Soubré", "Méagui"],
  "San-Pédro": ["San-Pédro", "Tabou", "Grabo"],
  "Tonkpi": ["Man", "Danané", "Zouan-Hounien"],
  "Guémon": ["Guiglo", "Bangolo"],
  "Folon": ["Minignan", "Kaniasso"],
  "Kabadougou": ["Odienné", "Gbéléban"],
  "Poro": ["Korhogo", "Sinématiali", "M'Bengué"],
  "Tchologo": ["Ferkessédougou", "Kong"],
  "Bagoué": ["Boundiali", "Tengréla"],
  "Gôh": ["Gagnoa", "Oumé"],
  "Lôh-Djiboua": ["Divo", "Guitry", "Lakota"],
};

export const VILLES_BY_DEPARTEMENT: Record<string, string[]> = {
  // ─── Grand Abidjan ───
  "Abidjan": ["Abidjan"],
  "Dabou": ["Dabou", "Lopou", "Tiagba"],
  "Jacqueville": ["Jacqueville", "Adjouan", "Aniambo"],
  "Grand-Lahou": ["Grand-Lahou", "Toukouzou"],
  // ─── Yamoussoukro ───
  "Yamoussoukro": ["Yamoussoukro"],
  "Attiégouakro": ["Attiégouakro"],
  // ─── Lagunes ───
  "Adzopé": ["Adzopé", "Akoupe", "Assahara"],
  "Alépé": ["Alépé", "Attobrou"],
  "Agboville": ["Agboville", "Azaguié", "Loviguié"],
  "Tiassalé": ["Tiassalé", "N'Douci"],
  "Sikensi": ["Sikensi", "Aboudé"],
  // ─── Lacs ───
  "Bongouanou": ["Bongouanou", "M'Batto", "Arrah"],
  "Dimbokro": ["Dimbokro", "Bocanda", "Kouassi-Kouassikro"],
  "Daoukro": ["Daoukro", "Prikro"],
  // ─── Zanzan ───
  "Bouna": ["Bouna", "Doropo", "Nassian"],
  "Bondoukou": ["Bondoukou", "Tanda", "Koun-Fao", "Transua"],
  // ─── Comoé ───
  "Aboisso": ["Aboisso", "Adiaké", "Ayamé", "Bianouan"],
  "Grand-Bassam": ["Grand-Bassam", "Assinie-Mafia", "Moossou"],
  "Adiaké": ["Adiaké", "Assinie"],
  "Abengourou": ["Abengourou", "Agnibilékrou", "Niable"],
  // ─── Vallée du Bandama ───
  "Bouaké": ["Bouaké", "Béoumi", "Sakassou", "Botro"],
  "Katiola": ["Katiola", "Niakaramandougou", "Tafiré"],
  "Daloa": ["Daloa", "Issia", "Vavoua", "Zuénoula"],
  // ─── Bas-Sassandra ───
  "Soubré": ["Soubré", "Méagui", "Buyo", "Gueyo"],
  "San-Pédro": ["San-Pédro", "Tabou", "Grabo", "Drewin"],
  "Sassandra": ["Sassandra", "Fresco", "Guitry"],
  // ─── Montagnes ───
  "Man": ["Man", "Danané", "Zouan-Hounien", "Bangolo", "Biankouma"],
  "Guiglo": ["Guiglo", "Taï", "Duékoué", "Bloléquin"],
  // ─── Savanes ───
  "Korhogo": ["Korhogo", "Sinématiali", "M'Bengué", "Napié"],
  "Ferkessédougou": ["Ferkessédougou", "Kong", "Ouangolodougou"],
  "Boundiali": ["Boundiali", "Tengréla", "Kouto"],
  // ─── Denguélé ───
  "Odienné": ["Odienné", "Gbéléban", "Madinani", "Samatiguila"],
  // ─── Gôh-Djiboua ───
  "Gagnoa": ["Gagnoa", "Oumé", "Gnagbodougnoa"],
  "Divo": ["Divo", "Guitry", "Lakota", "Tiassalé"],
};

// ── Communes par Ville ─────────────────────────────────────────────────────────
export const COMMUNES_BY_VILLE: Record<string, string[]> = {
  "Abidjan": [
    "Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi",
    "Marcory", "Plateau", "Port-Bouët", "Treichville", "Yopougon",
    "Bingerville", "Songon", "Anyama",
  ],
  "Bouaké": ["Bouaké-Nord-Est", "Bouaké-Nord-Ouest", "Bouaké-Sud"],
  "Daloa": ["Daloa-Centre", "Lobia", "Tazibouo", "Gbeuliville"],
  "San-Pédro": ["San-Pédro-Balmer", "San-Pédro-Cité", "Bassa"],
  "Korhogo": ["Korhogo-Centre", "Koko", "Soba", "Sinématiali"],
  "Yamoussoukro": ["Yamoussoukro-Centre", "Dioulakro", "Habitat", "Fétiveau"],
  "Grand-Bassam": ["Bassam-Quartier France", "Impérial", "Moossou", "Vitré 2"],
  "Gagnoa": ["Gagnoa-Centre", "Bromakote", "Dioulabougou"],
  "Man": ["Man-Centre", "Gbapleu", "Domoraud"],
  "Abengourou": ["Abengourou-Centre", "Kosangbé", "Nouveau Quartier"],
  "Divo": ["Divo-Centre", "Divo-Résidentiel"],
};

// ── Quartiers par Commune ou Ville ────────────────────────────────────────────
export const QUARTIERS_BY_COMMUNE: Record<string, string[]> = {
  // ─── Abidjan ───
  "Cocody": [
    "Riviera 1", "Riviera 2", "Riviera 3", "Riviera 4", "Riviera Palmeraie",
    "Riviera Golf", "Angré", "Angré Château", "Angré 8ème Tranche", "Danga",
    "Blockhauss", "II Plateaux", "II Plateaux Vallon", "Vallon", "Mermoz",
    "Ambassades", "Cocody Village", "Bonoumin", "Faya", "Lycée Technique",
    "Anono", "St. Jean", "Attoban", "Palmeraie Bonoumin",
  ],
  "Plateau": ["Centre Ville", "Commerce", "Indénié", "Administratif", "Abidjan Plateau"],
  "Marcory": ["Zone 4", "Biétry", "Anoumabo", "Remblai", "Zone 3C", "Sans Fil"],
  "Yopougon": [
    "Attié", "Selmer", "Niangon Nord", "Niangon Sud", "Wassakara",
    "Toits Rouges", "Kouté", "Siporex", "Sicogi", "Ananeraie",
    "Wassakara", "Millionnaire", "Washington", "Banco 1", "Banco 2",
    "N'Dotre", "Yaosséhi", "Lokoa",
  ],
  "Abobo": [
    "Baoulé", "Gare", "PK18", "Avocatier", "Samaké", "Clouetcha",
    "Abobo Gare", "Abobo-Baoulé", "Sagbé", "N'Dotré", "Abobo-Est",
    "Derrière Rails", "Pk 22", "Pk 26",
  ],
  "Adjamé": [
    "Liberté", "220 Logements", "Williamsville", "Village",
    "Adjamé Centre", "1er Août", "Clouetcha", "Habitat",
  ],
  "Koumassi": [
    "Centre", "Zone Industrielle", "Résidentiel",
    "Grand Campement", "Koumassi-Remblai", "Pétrolci",
  ],
  "Treichville": ["Centre", "Avenue 7", "Zone 3", "Port", "Vridi Canal"],
  "Port-Bouët": [
    "Vridi", "Village", "Gonzagueville", "Kouté", "Résidentiel",
    "Zone Industrielle", "Aéroport",
  ],
  "Attécoubé": ["Centre", "Sagbé", "Locodjro", "Andokoi", "Agban"],
  "Bingerville": ["Centre", "Résidentiel", "Moossou Route", "Cité SCI"],
  "Anyama": ["Centre", "Locodjro", "Anyama-Adjamé"],
  "Songon": ["Centre", "Dagbe", "Akoupe"],
  // ─── Bouaké ───
  "Bouaké-Nord-Est": ["Belleville", "Air France", "Dar Es Salam"],
  "Bouaké-Nord-Ouest": ["Kennedy", "N'Gattakro", "Broukro"],
  "Bouaké-Sud": ["Commerce", "Résidentiel", "Sokoura", "Sokoura 2"],
  // ─── Autres villes ───
  "Bassam-Quartier France": ["Quartier France", "Impérial", "Petit Paris"],
  "Moossou": ["Moossou Centre", "Adjouan"],
  "Korhogo-Centre": ["Commerce", "Résidentiel", "Koko", "Soba"],
  "Yamoussoukro-Centre": ["Centre", "Dioulakro", "Habitat", "Fétiveau"],
  "Gagnoa-Centre": ["Centre", "Bromakote", "Dioulabougou"],
};

export const QUARTIERS_BY_VILLE: Record<string, string[]> = {
  "Bouaké": ["Belleville", "Commerce", "Kennedy", "Air France", "Broukro", "N'Gattakro", "Dar Es Salam", "Résidentiel", "Sokoura"],
  "Yamoussoukro": ["Centre", "Dioulakro", "Fétiveau", "Habitat", "BCEAO", "Amissa"],
  "San-Pédro": ["Cité", "Balmer", "Centre Ville", "Port", "Bassa", "Résidentiel"],
  "Daloa": ["Commerce", "Lobia", "Tazibouo", "Gbeuliville", "Résidentiel"],
  "Korhogo": ["Commerce", "Résidentiel", "Koko", "Soba", "Sinématiali"],
  "Abengourou": ["Centre", "Kosangbé", "Nouveau Quartier", "Résidentiel"],
  "Man": ["Centre", "Gbapleu", "Domoraud", "Résidentiel"],
  "Gagnoa": ["Centre", "Bromakote", "Dioulabougou", "Résidentiel"],
  "Grand-Bassam": ["Quartier France", "Impérial", "Moossou", "Petit Paris", "Assinie"],
  "Soubré": ["Centre", "Résidentiel", "Akoupé-Zeudji"],
  "Ferkessédougou": ["Centre", "Résidentiel", "Kong Route"],
  "Divo": ["Centre", "Résidentiel", "Commerce"],
  "Aboisso": ["Centre", "Résidentiel", "Ayamé Route"],
  "Bondoukou": ["Centre", "Résidentiel", "Soko"],
  "Odienné": ["Centre", "Résidentiel", "Administratif"],
  "Dabou": ["Centre", "Résidentiel", "Port"],
  "Agboville": ["Centre", "Résidentiel", "Azaguié Route"],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export function getRegionsByDistrict(district: string): string[] {
  return REGIONS_BY_DISTRICT[district] || [];
}
export function getDepartementsByRegion(region: string): string[] {
  return DEPARTEMENTS_BY_REGION[region] || [];
}
export function getVillesByDepartement(dept: string): string[] {
  return VILLES_BY_DEPARTEMENT[dept] || [];
}
export function getCommunesByVille(ville: string): string[] {
  return COMMUNES_BY_VILLE[ville] || [];
}
export function getQuartiersByCommune(commune: string): string[] {
  return QUARTIERS_BY_COMMUNE[commune] || [];
}
export function getQuartiersByVille(ville: string): string[] {
  return QUARTIERS_BY_VILLE[ville] || [];
}

export const ALL_DISTRICTS = Object.keys(REGIONS_BY_DISTRICT);

// ── Lookup inverse : retrouver la hiérarchie depuis une ville ─────────────────
export function getHierarchyByVille(ville: string): {
  district: string; region: string; departement: string;
} | null {
  for (const [district, regions] of Object.entries(REGIONS_BY_DISTRICT)) {
    for (const region of regions) {
      const depts = DEPARTEMENTS_BY_REGION[region] || [];
      for (const dept of depts) {
        const villes = VILLES_BY_DEPARTEMENT[dept] || [];
        if (villes.includes(ville)) {
          return { district, region, departement: dept };
        }
      }
    }
  }
  return null;
}

export function getHierarchyByCommune(commune: string): {
  district: string; region: string; departement: string; city: string;
} | null {
  // Chercher dans COMMUNES_BY_VILLE
  for (const [ville, communes] of Object.entries(COMMUNES_BY_VILLE)) {
    if (communes.includes(commune)) {
      const hierarchy = getHierarchyByVille(ville);
      if (hierarchy) return { ...hierarchy, city: ville };
    }
  }
  return null;
}
