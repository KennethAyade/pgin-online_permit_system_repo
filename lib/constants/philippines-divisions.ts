/**
 * Philippine Administrative Divisions
 * Region -> Province -> City/Municipality -> Barangay
 */

export interface Barangay {
  name: string
}

export interface City {
  name: string
  barangays: Barangay[]
}

export interface Province {
  name: string
  cities: City[]
}

export interface Region {
  name: string
  code: string
  provinces: Province[]
}

// Sample data structure - this is a simplified version
// In production, you would want the complete list from the Philippine Statistics Authority
export const philippineDivisions: Region[] = [
  {
    name: "Region I - Ilocos Region",
    code: "Region I",
    provinces: [
      {
        name: "Ilocos Norte",
        cities: [
          {
            name: "Laoag City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "San Nicolas" },
              { name: "Paoay" },
            ],
          },
          {
            name: "Batac City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "San Vicente" },
            ],
          },
        ],
      },
      {
        name: "Ilocos Sur",
        cities: [
          {
            name: "Vigan City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "San Antonio" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Region II - Cagayan Valley",
    code: "Region II",
    provinces: [
      {
        name: "Cagayan",
        cities: [
          {
            name: "Tuguegarao City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Caritan" },
            ],
          },
        ],
      },
      {
        name: "Isabela",
        cities: [
          {
            name: "Santiago City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Region III - Central Luzon",
    code: "Region III",
    provinces: [
      {
        name: "Bataan",
        cities: [
          {
            name: "Balanga City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Ligtasan" },
            ],
          },
        ],
      },
      {
        name: "Bulacan",
        cities: [
          {
            name: "Malolos City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Santo Domingo" },
            ],
          },
        ],
      },
      {
        name: "Nueva Ecija",
        cities: [
          {
            name: "Cabanatuan City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Del Pilar" },
            ],
          },
        ],
      },
      {
        name: "Pampanga",
        cities: [
          {
            name: "Angeles City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Cutcut" },
            ],
          },
          {
            name: "San Fernando City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Maligaya" },
            ],
          },
        ],
      },
      {
        name: "Tarlac",
        cities: [
          {
            name: "Tarlac City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "San Isidro" },
            ],
          },
        ],
      },
      {
        name: "Zambales",
        cities: [
          {
            name: "Subic City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Cabcaben" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Region IV-A - CALABARZON",
    code: "Region IV-A",
    provinces: [
      {
        name: "Batangas",
        cities: [
          {
            name: "Batangas City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "San Guillermo" },
            ],
          },
        ],
      },
      {
        name: "Cavite",
        cities: [
          {
            name: "Dasmariñas City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Bucal" },
            ],
          },
        ],
      },
      {
        name: "Laguna",
        cities: [
          {
            name: "Calamba City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Paciano Rizal" },
            ],
          },
        ],
      },
      {
        name: "Quezon",
        cities: [
          {
            name: "Lucena City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Dalahican" },
            ],
          },
        ],
      },
      {
        name: "Rizal",
        cities: [
          {
            name: "Antipolo City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "San Roque" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Region V - Bicol",
    code: "Region V",
    provinces: [
      {
        name: "Albay",
        cities: [
          {
            name: "Legazpi City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Cabangan" },
            ],
          },
        ],
      },
      {
        name: "Camarines Norte",
        cities: [
          {
            name: "Daet",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
      {
        name: "Camarines Sur",
        cities: [
          {
            name: "Naga City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Del Pilar" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Region VI - Western Visayas",
    code: "Region VI",
    provinces: [
      {
        name: "Aklan",
        cities: [
          {
            name: "Kalibo",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Bagotals" },
            ],
          },
        ],
      },
      {
        name: "Antique",
        cities: [
          {
            name: "San Jose de Buenavista",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
      {
        name: "Capiz",
        cities: [
          {
            name: "Roxas City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Burgos" },
            ],
          },
        ],
      },
      {
        name: "Iloilo",
        cities: [
          {
            name: "Iloilo City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Alaguisoc" },
            ],
          },
        ],
      },
      {
        name: "Negros Occidental",
        cities: [
          {
            name: "Bacolod City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Abutin" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Region VII - Central Visayas",
    code: "Region VII",
    provinces: [
      {
        name: "Bohol",
        cities: [
          {
            name: "Tagbilaran City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Canlumpic" },
            ],
          },
        ],
      },
      {
        name: "Cebu",
        cities: [
          {
            name: "Cebu City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Apas" },
            ],
          },
          {
            name: "Lapu-Lapu City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Agutayan" },
            ],
          },
        ],
      },
      {
        name: "Negros Oriental",
        cities: [
          {
            name: "Dumaguete City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Bajumpandan" },
            ],
          },
        ],
      },
      {
        name: "Siquijor",
        cities: [
          {
            name: "Larena",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Region VIII - Eastern Visayas",
    code: "Region VIII",
    provinces: [
      {
        name: "Eastern Samar",
        cities: [
          {
            name: "Borongan City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
      {
        name: "Leyte",
        cities: [
          {
            name: "Tacloban City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Apitong" },
            ],
          },
        ],
      },
      {
        name: "Northern Samar",
        cities: [
          {
            name: "Catarman",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
      {
        name: "Southern Leyte",
        cities: [
          {
            name: "Maasin City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
      {
        name: "Western Samar",
        cities: [
          {
            name: "Calbayog City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Cabatangan" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Region IX - Zamboanga Peninsula",
    code: "Region IX",
    provinces: [
      {
        name: "Misamis Occidental",
        cities: [
          {
            name: "Ozamis City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Bagumbayan" },
            ],
          },
        ],
      },
      {
        name: "Misamis Oriental",
        cities: [
          {
            name: "Cagayan de Oro",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Balulang" },
            ],
          },
        ],
      },
      {
        name: "Zamboanga del Norte",
        cities: [
          {
            name: "Dipolog City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Bunguiao" },
            ],
          },
        ],
      },
      {
        name: "Zamboanga del Sur",
        cities: [
          {
            name: "Pagadian City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Balangasan" },
            ],
          },
        ],
      },
      {
        name: "Zamboanga Sibugay",
        cities: [
          {
            name: "Ipil",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Region X - Northern Mindanao",
    code: "Region X",
    provinces: [
      {
        name: "Bukidnon",
        cities: [
          {
            name: "Cagayan de Oro",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Balulang" },
            ],
          },
        ],
      },
      {
        name: "Camiguin",
        cities: [
          {
            name: "Mambajao",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Region XI - Davao Region",
    code: "Region XI",
    provinces: [
      {
        name: "Davao del Norte",
        cities: [
          {
            name: "Tagum City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Anislagan" },
            ],
          },
        ],
      },
      {
        name: "Davao del Sur",
        cities: [
          {
            name: "Digos City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Bago Gallera" },
            ],
          },
        ],
      },
      {
        name: "Davao Oriental",
        cities: [
          {
            name: "Mati City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
      {
        name: "Davao Occidental",
        cities: [
          {
            name: "Malita",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Region XII - SOCCSKSARGEN",
    code: "Region XII",
    provinces: [
      {
        name: "Cotabato",
        cities: [
          {
            name: "Kidapawan City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Alanib" },
            ],
          },
        ],
      },
      {
        name: "South Cotabato",
        cities: [
          {
            name: "Koronadal City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Barangay 3" },
            ],
          },
        ],
      },
      {
        name: "Sarangani",
        cities: [
          {
            name: "Alabel",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
      {
        name: "Sultan Kudarat",
        cities: [
          {
            name: "Tacurong City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Columio" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Region XIII - Caraga",
    code: "Region XIII",
    provinces: [
      {
        name: "Agusan del Norte",
        cities: [
          {
            name: "Butuan City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Agusan" },
            ],
          },
        ],
      },
      {
        name: "Agusan del Sur",
        cities: [
          {
            name: "Bislig City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
      {
        name: "Dinagat Islands",
        cities: [
          {
            name: "San Jose",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
      {
        name: "Surigao del Norte",
        cities: [
          {
            name: "Surigao City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Barangay 3" },
            ],
          },
        ],
      },
      {
        name: "Surigao del Sur",
        cities: [
          {
            name: "Tandag City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "National Capital Region",
    code: "NCR",
    provinces: [
      {
        name: "Metro Manila",
        cities: [
          {
            name: "Manila",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Barangay 3" },
            ],
          },
          {
            name: "Quezon City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Apolonio Samson" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Cordillera Administrative Region",
    code: "CAR",
    provinces: [
      {
        name: "Abra",
        cities: [
          {
            name: "Bangued",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
      {
        name: "Apayao",
        cities: [
          {
            name: "Camalaniugan",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
      {
        name: "Benguet",
        cities: [
          {
            name: "Baguio City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Asin" },
            ],
          },
        ],
      },
      {
        name: "Ifugao",
        cities: [
          {
            name: "Lagawe",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
      {
        name: "Kalinga",
        cities: [
          {
            name: "Tabuk City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Bangbanag" },
            ],
          },
        ],
      },
      {
        name: "Mountain Province",
        cities: [
          {
            name: "Bontoc",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
      {
        name: "Nueva Vizcaya",
        cities: [
          {
            name: "Bayombong",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
      {
        name: "Quirino",
        cities: [
          {
            name: "Cabanatuan City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "ARMM - Autonomous Region in Muslim Mindanao",
    code: "ARMM",
    provinces: [
      {
        name: "Lanao del Norte",
        cities: [
          {
            name: "Iligan City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Barangay 3" },
            ],
          },
        ],
      },
      {
        name: "Lanao del Sur",
        cities: [
          {
            name: "Marawi City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Barangay 3" },
            ],
          },
        ],
      },
      {
        name: "Maguindanao",
        cities: [
          {
            name: "Cotabato City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Barangay 3" },
            ],
          },
        ],
      },
      {
        name: "Tawi-Tawi",
        cities: [
          {
            name: "Bongao",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
            ],
          },
        ],
      },
      {
        name: "Basilan",
        cities: [
          {
            name: "Isabela City",
            barangays: [
              { name: "Barangay 1" },
              { name: "Barangay 2" },
              { name: "Barangay 3" },
            ],
          },
        ],
      },
    ],
  },
]

/**
 * Utility functions for working with Philippine divisions
 */

export const getRegions = (): Region[] => {
  return philippineDivisions
}

export const getProvincesByRegion = (regionCode: string): Province[] => {
  const region = philippineDivisions.find((r) => r.code === regionCode)
  return region?.provinces || []
}

export const getCitiesByProvince = (
  regionCode: string,
  provinceName: string
): City[] => {
  const region = philippineDivisions.find((r) => r.code === regionCode)
  const province = region?.provinces.find((p) => p.name === provinceName)
  return province?.cities || []
}

export const getBarangaysByCity = (
  regionCode: string,
  provinceName: string,
  cityName: string
): Barangay[] => {
  const region = philippineDivisions.find((r) => r.code === regionCode)
  const province = region?.provinces.find((p) => p.name === provinceName)
  const city = province?.cities.find((c) => c.name === cityName)
  return city?.barangays || []
}
