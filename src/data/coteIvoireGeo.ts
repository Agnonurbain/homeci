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
  "Bouaké": ["Bouaké-Nord-Est", "Bouaké-Nord-Ouest", "Bouaké-Sud", "Broukro", "Air France 2", "Dar Es Salam", "Koko", "Commerce", "Nimbo", "Bel Air"],
  "Daloa": ["Daloa-Centre", "Lobia", "Tazibouo", "Gbeuliville", "Kennedy", "Zebuo", "Tapeguia", "Marais", "Petit Marché"],
  "San-Pédro": ["San-Pédro-Balmer", "San-Pédro-Cité", "Bassa", "Cité CAA", "Bardot", "Hôtel de Ville", "Gabé", "Dewoin"],
  "Korhogo": ["Korhogo-Centre", "Koko", "Soba", "Sinématiali", "Tchériba", "Résidentiel", "Petit Marché", "Gonfreville", "Nafana"],
  "Yamoussoukro": ["Yamoussoukro-Centre", "Dioulakro", "Habitat", "Fétiveau", "N'Gokro", "Kokrenou", "Lolobo", "Morofé", "Nanan Koffi"],
  "Grand-Bassam": ["Bassam-Quartier France", "Impérial", "Moossou", "Vitré 2", "Phare", "Est", "Belle Ville", "Rabi"],
  "Gagnoa": ["Gagnoa-Centre", "Bromakote", "Dioulabougou", "Gnagbodougnoa", "Dougbé", "Cité Sogefiha"],
  "Man": ["Man-Centre", "Gbapleu", "Domoraud", "Liberté", "Plateau", "Sable", "Pété", "Yapleu"],
  "Abengourou": ["Abengourou-Centre", "Kosangbé", "Nouveau Quartier", "Morokro", "Résidentiel", "Commerce"],
  "Divo": ["Divo-Centre", "Divo-Résidentiel", "Guitry", "Lakota", "Tiassalé", "Gare", "Cité"],
  "Agboville": ["Agboville-Centre", "Azaguié", "Loviguié", "Résidentiel", "Gare"],
  "Soubré": ["Soubré-Centre", "Méagui", "Buyo", "Gueyo", "Dakpa", "Liliyo"],
  "Sassandra": ["Sassandra-Centre", "Fresco", "Gare", "Plage", "Résidentiel"],
  "Bondoukou": ["Bondoukou-Centre", "Tanda", "Koun-Fao", "Transua", "Résidentiel", "Commerce"],
  "Aboisso": ["Aboisso-Centre", "Adiaké", "Ayamé", "Bianouan", "Résidentiel"],
  "Dimbokro": ["Dimbokro-Centre", "Bocanda", "Kouassi-Kouassikro", "Résidentiel"],
  "Daoukro": ["Daoukro-Centre", "Prikro", "Résidentiel", "Commerce"],
  "Bongouanou": ["Bongouanou-Centre", "M'Batto", "Arrah", "Résidentiel"],
  "Odienné": ["Odienné-Centre", "Gbéléban", "Madinani", "Samatiguila", "Résidentiel"],
  "Ferkessédougou": ["Ferkessédougou-Centre", "Kong", "Ouangolodougou", "Résidentiel", "Commerce"],
  "Boundiali": ["Boundiali-Centre", "Tengréla", "Kouto", "Résidentiel"],
  "Guiglo": ["Guiglo-Centre", "Taï", "Duékoué", "Bloléquin", "Résidentiel"],
  "Bouna": ["Bouna-Centre", "Doropo", "Nassian", "Résidentiel"],
  "Touba": ["Touba-Centre", "Mankono", "Séguéla", "Résidentiel"],
};

// ── Quartiers par Commune ou Ville ────────────────────────────────────────────
export const QUARTIERS_BY_COMMUNE: Record<string, string[]> = {
  // ─── Abidjan ───
  "Cocody": [
    "Riviera 1", "Riviera 2", "Riviera 3", "Riviera 4", "Riviera 5", "Riviera Palmeraie",
    "Riviera Golf", "Angré", "Angré Château", "Angré 8ème Tranche", "Danga",
    "Blockhauss", "II Plateaux", "II Plateaux Vallon", "Vallon", "Mermoz",
    "Ambassades", "Cocody Village", "Bonoumin", "Faya", "Lycée Technique",
    "Anono", "St. Jean", "Attoban", "Palmeraie Bonoumin", "Cocotiers",
    "Sicap Cocody", "N'Goron", "Abatta", "Riviera Faya",
  ],
  "Plateau": ["Centre Ville", "Commerce", "Indénié", "Administratif", "Abidjan Plateau", "Cité Administrative", "Camp Gallieni"],
  "Marcory": ["Zone 4", "Biétry", "Anoumabo", "Remblai", "Zone 3C", "Sans Fil", "Résidentiel", "Vallon", "Bel Air"],
  "Yopougon": [
    "Attié", "Selmer", "Niangon Nord", "Niangon Sud", "Wassakara",
    "Toits Rouges", "Kouté", "Siporex", "Sicogi", "Ananeraie",
    "Millionnaire", "Washington", "Banco 1", "Banco 2",
    "N'Dotre", "Yaosséhi", "Lokoa", "Maroc", "Koweit", "Sideci",
    "Nouveau Quartier", "Cité Sogefiha",
  ],
  "Abobo": [
    "Baoulé", "Gare", "PK18", "Avocatier", "Samaké", "Clouetcha",
    "Abobo Gare", "Abobo-Baoulé", "Sagbé", "N'Dotré", "Abobo-Est",
    "Derrière Rails", "Pk 22", "Pk 26", "Anyama Route", "Toit Rouge",
    "Abobo-Sud", "Banco", "Castor",
  ],
  "Adjamé": [
    "Liberté", "220 Logements", "Williamsville", "Village",
    "Adjamé Centre", "1er Août", "Clouetcha", "Habitat",
    "Bracodi", "Adjamé 3ème Tranche", "Adjouabré",
  ],
  "Koumassi": [
    "Centre", "Zone Industrielle", "Résidentiel",
    "Grand Campement", "Koumassi-Remblai", "Pétrolci",
    "Anono", "Mimosas", "Akwaba",
  ],
  "Treichville": ["Centre", "Avenue 7", "Zone 3", "Port", "Vridi Canal", "Belleville", "France", "Blanco"],
  "Port-Bouët": [
    "Vridi", "Village", "Gonzagueville", "Kouté", "Résidentiel",
    "Zone Industrielle", "Aéroport", "Sicogi", "Cité UAT",
    "Nouveau Quartier", "Biafra", "Bd de Marseille",
  ],
  "Attécoubé": ["Centre", "Sagbé", "Locodjro", "Andokoi", "Agban", "Attié", "Droz"],
  "Bingerville": ["Centre", "Résidentiel", "Moossou Route", "Cité SCI", "Cité Universitaire", "Socioca"],
  "Anyama": ["Centre", "Locodjro", "Anyama-Adjamé", "Abidjanaise", "Gare"],
  "Songon": ["Centre", "Dagbe", "Akoupe", "Banco"],
  // ─── Bouaké ───
  "Bouaké-Nord-Est": ["Belleville", "Air France", "Dar Es Salam", "Nimbo", "Koko"],
  "Bouaké-Nord-Ouest": ["Kennedy", "N'Gattakro", "Broukro", "Bel Air"],
  "Bouaké-Sud": ["Commerce", "Résidentiel", "Sokoura", "Sokoura 2", "Gonfreville"],
  // ─── Yamoussoukro ───
  "Yamoussoukro-Centre": ["Centre", "Dioulakro", "Habitat", "Fétiveau", "N'Gokro", "Kokrenou"],
  "Dioulakro": ["Dioulakro Centre", "Dioulakro Résidentiel"],
  "Habitat": ["Habitat Centre", "Habitat Extension"],
  "Fétiveau": ["Fétiveau Centre", "Fétiveau Résidentiel"],
  // ─── Daloa ───
  "Daloa-Centre": ["Centre Ville", "Kennedy", "Marais", "Petit Marché", "Gare"],
  "Lobia": ["Lobia Centre", "Lobia Résidentiel"],
  "Tazibouo": ["Tazibouo Centre", "Tazibouo Résidentiel"],
  // ─── San-Pédro ───
  "San-Pédro-Cité": ["Cité CAA", "Bardot", "Hôtel de Ville", "Gabé", "Dewoin"],
  "San-Pédro-Balmer": ["Balmer Centre", "Balmer Plage", "Balmer Résidentiel"],
  "Bassa": ["Bassa Centre", "Bassa Plage", "Bassa Port"],
  // ─── Korhogo ───
  "Korhogo-Centre": ["Commerce", "Résidentiel", "Koko", "Soba", "Petit Marché", "Gare"],
  "Soba": ["Soba Centre", "Soba Résidentiel"],
  "Koko": ["Koko Centre", "Koko Commerce"],
  // ─── Man ───
  "Man-Centre": ["Centre Ville", "Liberté", "Plateau", "Sable", "Pété", "Yapleu"],
  "Gbapleu": ["Gbapleu Centre", "Gbapleu Résidentiel"],
  // ─── Gagnoa ───
  "Gagnoa-Centre": ["Centre", "Bromakote", "Dioulabougou", "Gnagbodougnoa", "Dougbé"],
  // ─── Autres villes ───
  "Bassam-Quartier France": ["Quartier France", "Impérial", "Petit Paris", "Phare"],
  "Moossou": ["Moossou Centre", "Adjouan", "Moossou Plage"],
  "Grand-Bassam": ["Quartier France", "Impérial", "Moossou", "Petit Paris", "Phare", "Est", "Belle Ville"],
  "Agboville-Centre": ["Centre Ville", "Gare", "Résidentiel", "Commerce"],
  "Soubré-Centre": ["Centre Ville", "Dakpa", "Liliyo", "Gare"],
  "Sassandra-Centre": ["Centre Ville", "Gare", "Plage", "Résidentiel"],
  "Bondoukou-Centre": ["Centre Ville", "Soko", "Résidentiel", "Commerce"],
  "Aboisso-Centre": ["Centre Ville", "Résidentiel", "Commerce", "Gare"],
  "Dimbokro-Centre": ["Centre Ville", "Résidentiel", "Commerce"],
  "Daoukro-Centre": ["Centre Ville", "Résidentiel", "Commerce"],
  "Ferkessédougou-Centre": ["Centre Ville", "Résidentiel", "Commerce", "Gare"],
  "Boundiali-Centre": ["Centre Ville", "Résidentiel", "Commerce"],
  "Guiglo-Centre": ["Centre Ville", "Résidentiel", "Commerce"],
  "Bouna-Centre": ["Centre Ville", "Résidentiel", "Commerce"],
  "Odienné-Centre": ["Centre Ville", "Résidentiel", "Administratif"],
  "Abengourou-Centre": ["Centre Ville", "Kosangbé", "Morokro", "Résidentiel"],
  "Divo-Centre": ["Centre Ville", "Gare", "Cité", "Résidentiel"],
};

export const QUARTIERS_BY_VILLE: Record<string, string[]> = {
  "Bouaké": ["Belleville", "Commerce", "Kennedy", "Air France", "Broukro", "N'Gattakro", "Dar Es Salam", "Résidentiel", "Sokoura", "Gonfreville", "Nimbo", "Koko", "Bel Air"],
  "Yamoussoukro": ["Centre", "Dioulakro", "Fétiveau", "Habitat", "BCEAO", "Amissa", "N'Gokro", "Kokrenou", "Lolobo", "Morofé", "Nanan Koffi"],
  "San-Pédro": ["Cité", "Balmer", "Centre Ville", "Port", "Bassa", "Résidentiel", "Cité CAA", "Bardot", "Hôtel de Ville", "Gabé", "Dewoin"],
  "Daloa": ["Commerce", "Lobia", "Tazibouo", "Gbeuliville", "Résidentiel", "Kennedy", "Marais", "Petit Marché", "Gare", "Zebuo"],
  "Korhogo": ["Commerce", "Résidentiel", "Koko", "Soba", "Sinématiali", "Tchériba", "Petit Marché", "Gonfreville", "Nafana", "Gare"],
  "Abengourou": ["Centre", "Kosangbé", "Nouveau Quartier", "Résidentiel", "Morokro", "Commerce", "Gare"],
  "Man": ["Centre", "Gbapleu", "Domoraud", "Résidentiel", "Liberté", "Plateau", "Sable", "Pété", "Yapleu"],
  "Gagnoa": ["Centre", "Bromakote", "Dioulabougou", "Résidentiel", "Gnagbodougnoa", "Dougbé", "Cité Sogefiha"],
  "Grand-Bassam": ["Quartier France", "Impérial", "Moossou", "Petit Paris", "Assinie", "Phare", "Est", "Belle Ville", "Rabi"],
  "Soubré": ["Centre", "Résidentiel", "Akoupé-Zeudji", "Dakpa", "Liliyo", "Gare"],
  "Ferkessédougou": ["Centre", "Résidentiel", "Kong Route", "Commerce", "Gare"],
  "Divo": ["Centre", "Résidentiel", "Commerce", "Gare", "Cité", "Guitry", "Lakota"],
  "Aboisso": ["Centre", "Résidentiel", "Ayamé Route", "Commerce", "Gare", "Adiaké", "Bianouan"],
  "Bondoukou": ["Centre", "Résidentiel", "Soko", "Commerce", "Gare", "Tanda", "Koun-Fao"],
  "Odienné": ["Centre", "Résidentiel", "Administratif", "Commerce", "Gbéléban", "Madinani"],
  "Dabou": ["Centre", "Résidentiel", "Port", "Lopou", "Tiagba"],
  "Agboville": ["Centre", "Résidentiel", "Azaguié Route", "Commerce", "Gare", "Loviguié"],
  "Dimbokro": ["Centre", "Résidentiel", "Commerce", "Bocanda", "Kouassi-Kouassikro"],
  "Daoukro": ["Centre", "Résidentiel", "Commerce", "Prikro"],
  "Bongouanou": ["Centre", "Résidentiel", "Commerce", "M'Batto", "Arrah"],
  "Boundiali": ["Centre", "Résidentiel", "Commerce", "Tengréla", "Kouto"],
  "Guiglo": ["Centre", "Résidentiel", "Commerce", "Taï", "Duékoué", "Bloléquin"],
  "Bouna": ["Centre", "Résidentiel", "Commerce", "Doropo", "Nassian"],
  "Sassandra": ["Centre", "Résidentiel", "Plage", "Gare", "Fresco"],
  "Touba": ["Centre", "Résidentiel", "Commerce", "Mankono", "Séguéla"],
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
