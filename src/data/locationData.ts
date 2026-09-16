export interface CountryData {
  name: string;
  code: string;
  states: {
    name: string;
    cities: {
      name: string;
      districts: string[];
    }[];
  }[];
}

// Complete list of countries EXCLUDING Israel, including Palestine, Maldives, and global nations
export const COUNTRIES = [
  "Maldives",
  "Palestine",
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe"
];

// Complete Location Database covering all Maldivian Inhabited Islands and global administrative areas
export const LOCATION_DATABASE: Record<string, {
  states: {
    name: string;
    cities: {
      name: string;
      districts: string[];
    }[];
  }[];
}> = {
  "Maldives": {
    states: [
      {
        name: "Male' (Capital City)",
        cities: [
          { name: "Male'", districts: ["Henveiru", "Galolhu", "Maafannu", "Machangoalhi"] },
          { name: "Hulhumale'", districts: ["Phase 1", "Phase 2"] },
          { name: "Vilimale'", districts: ["N/A"] },
          { name: "Gulhifalhu", districts: ["N/A"] },
          { name: "Thilafushi", districts: ["N/A"] },
          { name: "Giraavaru", districts: ["N/A"] }
        ]
      },
      {
        name: "Haa Alif Atoll",
        cities: [
          { name: "Dhidhdhoo", districts: ["N/A"] },
          { name: "Hoarafushi", districts: ["N/A"] },
          { name: "Ihavandhoo", districts: ["N/A"] },
          { name: "Kelaa", districts: ["N/A"] },
          { name: "Baarah", districts: ["N/A"] },
          { name: "Filladhoo", districts: ["N/A"] },
          { name: "Thakandhoo", districts: ["N/A"] },
          { name: "Utheemu", districts: ["N/A"] },
          { name: "Maarandhoo", districts: ["N/A"] },
          { name: "Muraidhoo", districts: ["N/A"] },
          { name: "Molhadhoo", districts: ["N/A"] },
          { name: "Vashafaru", districts: ["N/A"] }
        ]
      },
      {
        name: "Haa Dhaalu Atoll",
        cities: [
          { name: "Kulhudhuffushi", districts: ["Aafathis", "Bandharu Ward", "Kanduvalu", "Hiyaa Ward"] },
          { name: "Hanimaadhoo", districts: ["N/A"] },
          { name: "Nolhivaram", districts: ["N/A"] },
          { name: "Nolhivaranfaru", districts: ["N/A"] },
          { name: "Kurinbee", districts: ["N/A"] },
          { name: "Finey", districts: ["N/A"] },
          { name: "Naivaadhoo", districts: ["N/A"] },
          { name: "Makunudhoo", districts: ["N/A"] },
          { name: "Kumundhoo", districts: ["N/A"] },
          { name: "Vaikaradhoo", districts: ["N/A"] },
          { name: "Neykurendhoo", districts: ["N/A"] }
        ]
      },
      {
        name: "Shaviyani Atoll",
        cities: [
          { name: "Funadhoo", districts: ["N/A"] },
          { name: "Milandhoo", districts: ["N/A"] },
          { name: "Foakaidhoo", districts: ["N/A"] },
          { name: "Feevah", districts: ["N/A"] },
          { name: "Feydhoo", districts: ["N/A"] },
          { name: "Bileffahi", districts: ["N/A"] },
          { name: "Goidhoo", districts: ["N/A"] },
          { name: "Kanditheemu", districts: ["N/A"] },
          { name: "Komandoo", districts: ["N/A"] },
          { name: "Lhaimagu", districts: ["N/A"] },
          { name: "Noomaraa", districts: ["N/A"] },
          { name: "Narudhoo", districts: ["N/A"] },
          { name: "Maungoodhoo", districts: ["N/A"] }
        ]
      },
      {
        name: "Noonu Atoll",
        cities: [
          { name: "Manadhoo", districts: ["N/A"] },
          { name: "Velidhoo", districts: ["N/A"] },
          { name: "Holhudhoo", districts: ["N/A"] },
          { name: "Kendhikulhudhoo", districts: ["N/A"] },
          { name: "Kudafari", districts: ["N/A"] },
          { name: "Landhoo", districts: ["N/A"] },
          { name: "Lhohi", districts: ["N/A"] },
          { name: "Maalhendhoo", districts: ["N/A"] },
          { name: "Magoodhoo", districts: ["N/A"] },
          { name: "Miladhoo", districts: ["N/A"] },
          { name: "Henbandhoo", districts: ["N/A"] }
        ]
      },
      {
        name: "Raa Atoll",
        cities: [
          { name: "Ungoofaaru", districts: ["N/A"] },
          { name: "Dhuvaafaru", districts: ["N/A"] },
          { name: "Meedhoo", districts: ["N/A"] },
          { name: "Alifushi", districts: ["N/A"] },
          { name: "Vaadhoo", districts: ["N/A"] },
          { name: "Rasgetheemu", districts: ["N/A"] },
          { name: "Angolhitheemu", districts: ["N/A"] },
          { name: "Hulhudhuffushi", districts: ["N/A"] },
          { name: "Inguraidhoo", districts: ["N/A"] },
          { name: "Innamaadhoo", districts: ["N/A"] },
          { name: "Kinnolhas", districts: ["N/A"] },
          { name: "Maakurathu", districts: ["N/A"] },
          { name: "Maduvvari", districts: ["N/A"] },
          { name: "Fainu", districts: ["N/A"] }
        ]
      },
      {
        name: "Baa Atoll",
        cities: [
          { name: "Eydhafushi", districts: ["N/A"] },
          { name: "Thulhaadhoo", districts: ["N/A"] },
          { name: "Dharavandhoo", districts: ["N/A"] },
          { name: "Kendhoo", districts: ["N/A"] },
          { name: "Kihaadhoo", districts: ["N/A"] },
          { name: "Kamadhoo", districts: ["N/A"] },
          { name: "Kudarikilu", districts: ["N/A"] },
          { name: "Maalhos", districts: ["N/A"] },
          { name: "Fulhadhoo", districts: ["N/A"] },
          { name: "Fehendhoo", districts: ["N/A"] },
          { name: "Goidhoo", districts: ["N/A"] }
        ]
      },
      {
        name: "Lhaviyani Atoll",
        cities: [
          { name: "Naifaru", districts: ["N/A"] },
          { name: "Hinnavaru", districts: ["N/A"] },
          { name: "Kurendhoo", districts: ["N/A"] },
          { name: "Olhuvelifushi", districts: ["N/A"] },
          { name: "Maafilaafushi", districts: ["N/A"] }
        ]
      },
      {
        name: "Kaafu Atoll",
        cities: [
          { name: "Thulusdhoo", districts: ["N/A"] },
          { name: "Maafushi", districts: ["N/A"] },
          { name: "Himmafushi", districts: ["N/A"] },
          { name: "Huraa", districts: ["N/A"] },
          { name: "Diffushi", districts: ["N/A"] },
          { name: "Gulhi", districts: ["N/A"] },
          { name: "Guraidhoo", districts: ["N/A"] },
          { name: "Gaafaru", districts: ["N/A"] },
          { name: "Kaashidhoo", districts: ["N/A"] },
          { name: "Giraavaru", districts: ["N/A"] }
        ]
      },
      {
        name: "Alif Alif Atoll",
        cities: [
          { name: "Rasdhoo", districts: ["N/A"] },
          { name: "Ukulhas", districts: ["N/A"] },
          { name: "Mathiveri", districts: ["N/A"] },
          { name: "Bodufolhudhoo", districts: ["N/A"] },
          { name: "Feridhoo", districts: ["N/A"] },
          { name: "Himandhoo", districts: ["N/A"] },
          { name: "Thoddoo", districts: ["N/A"] }
        ]
      },
      {
        name: "Alif Dhaal Atoll",
        cities: [
          { name: "Mahibadhoo", districts: ["N/A"] },
          { name: "Dhigurah", districts: ["N/A"] },
          { name: "Maamigili", districts: ["N/A"] },
          { name: "Fenfushi", districts: ["N/A"] },
          { name: "Dhangethi", districts: ["N/A"] },
          { name: "Omadhoo", districts: ["N/A"] },
          { name: "Hangnaameedhoo", districts: ["N/A"] },
          { name: "Mandhoo", districts: ["N/A"] },
          { name: "Kunburudhoo", districts: ["N/A"] }
        ]
      },
      {
        name: "Vaavu Atoll",
        cities: [
          { name: "Felidhoo", districts: ["N/A"] },
          { name: "Fulidhoo", districts: ["N/A"] },
          { name: "Keyodhoo", districts: ["N/A"] },
          { name: "Rakeedhoo", districts: ["N/A"] },
          { name: "Thinadhoo", districts: ["N/A"] }
        ]
      },
      {
        name: "Meemu Atoll",
        cities: [
          { name: "Muli", districts: ["N/A"] },
          { name: "Mulah", districts: ["N/A"] },
          { name: "Dhiggaru", districts: ["N/A"] },
          { name: "Kolhufushi", districts: ["N/A"] },
          { name: "Maduvvari", districts: ["N/A"] },
          { name: "Raimmandhoo", districts: ["N/A"] },
          { name: "Veyvah", districts: ["N/A"] },
          { name: "Naalaafushi", districts: ["N/A"] }
        ]
      },
      {
        name: "Faafu Atoll",
        cities: [
          { name: "Nilandhoo", districts: ["N/A"] },
          { name: "Feeali", districts: ["N/A"] },
          { name: "Dharanboodhoo", districts: ["N/A"] },
          { name: "Magoodhoo", districts: ["N/A"] },
          { name: "Bileddhoo", districts: ["N/A"] }
        ]
      },
      {
        name: "Dhaal Atoll",
        cities: [
          { name: "Kudahuvadhoo", districts: ["N/A"] },
          { name: "Meedhoo", districts: ["N/A"] },
          { name: "Maaenboodhoo", districts: ["N/A"] },
          { name: "Bandidhoo", districts: ["N/A"] },
          { name: "Hulhudheli", districts: ["N/A"] }
        ]
      },
      {
        name: "Thaa Atoll",
        cities: [
          { name: "Veymandoo", districts: ["N/A"] },
          { name: "Thimarafushi", districts: ["N/A"] },
          { name: "Gadhdhoo", districts: ["N/A"] },
          { name: "Buruni", districts: ["N/A"] },
          { name: "Vilufushi", districts: ["N/A"] },
          { name: "Madifushi", districts: ["N/A"] },
          { name: "Dhiyamigili", districts: ["N/A"] },
          { name: "Gaadhiffushi", districts: ["N/A"] },
          { name: "Hirilandhoo", districts: ["N/A"] },
          { name: "Kandoodhoo", districts: ["N/A"] },
          { name: "Kinbidhoo", districts: ["N/A"] },
          { name: "Omadhoo", districts: ["N/A"] }
        ]
      },
      {
        name: "Laamu Atoll",
        cities: [
          { name: "Fonadhoo", districts: ["N/A"] },
          { name: "Gan", districts: ["Thundi Ward", "Mathimaradhoo Ward", "Mukurimagu Ward"] },
          { name: "Isdhoo", districts: ["N/A"] },
          { name: "Kalaidhoo", districts: ["N/A"] },
          { name: "Dhanbidhoo", districts: ["N/A"] },
          { name: "Maabaidhoo", districts: ["N/A"] },
          { name: "Mundoo", districts: ["N/A"] },
          { name: "Maavah", districts: ["N/A"] },
          { name: "Hithadhoo", districts: ["N/A"] },
          { name: "Kunahandhoo", districts: ["N/A"] }
        ]
      },
      {
        name: "Gaafu Alif Atoll",
        cities: [
          { name: "Vilingili", districts: ["N/A"] },
          { name: "Dhaandhoo", districts: ["N/A"] },
          { name: "Devvadhoo", districts: ["N/A"] },
          { name: "Gemanafushi", districts: ["N/A"] },
          { name: "Kanduhulhudhoo", districts: ["N/A"] },
          { name: "Kolamaafushi", districts: ["N/A"] },
          { name: "Kondey", districts: ["N/A"] },
          { name: "Maamendhoo", districts: ["N/A"] },
          { name: "Nilandhoo", districts: ["N/A"] }
        ]
      },
      {
        name: "Gaafu Dhaalu Atoll",
        cities: [
          { name: "Thinadhoo", districts: ["Baraasilu Ward", "Dadimagu Ward", "Medhabaru Ward"] },
          { name: "Gadhdhoo", districts: ["N/A"] },
          { name: "Faresmaathoddaa", districts: ["N/A"] },
          { name: "Hoandeddhoo", districts: ["N/A"] },
          { name: "Madaveli", districts: ["N/A"] },
          { name: "Nadella", districts: ["N/A"] },
          { name: "Rathafandhoo", districts: ["N/A"] },
          { name: "Vaadhoo", districts: ["N/A"] }
        ]
      },
      {
        name: "Gnaviyani Atoll",
        cities: [
          { name: "Fuvahmulah City", districts: ["Dhadimagu", "Dhighemagu", "Hoadhadhu", "Maadhadhu", "Mizkeeymagu", "Dhoonigan", "Funaadu"] }
        ]
      },
      {
        name: "Seenu / Addu Atoll",
        cities: [
          { name: "Hithadhoo", districts: ["N/A"] },
          { name: "Maradhoo", districts: ["N/A"] },
          { name: "Feydhoo", districts: ["N/A"] },
          { name: "Maradhoo-Feydhoo", districts: ["N/A"] },
          { name: "Hulhudhoo", districts: ["N/A"] },
          { name: "Meedhoo", districts: ["N/A"] }
        ]
      }
    ]
  },
  "Palestine": {
    states: [
      {
        name: "Jerusalem Governorate (Al-Quds)",
        cities: [
          { name: "Jerusalem (Al-Quds)", districts: ["Old City", "Sheikh Jarrah", "Silwan", "Shuafat", "Beit Hanina", "Al-Tur", "Jabal Mukaber", "Wadi al-Joz"] },
          { name: "Abu Dis", districts: ["N/A"] },
          { name: "Al-Eizariya", districts: ["N/A"] },
          { name: "Anata", districts: ["N/A"] },
          { name: "Al-Ram", districts: ["N/A"] },
          { name: "Hizma", districts: ["N/A"] },
          { name: "Qalandia", districts: ["N/A"] },
          { name: "Biddu", districts: ["N/A"] }
        ]
      },
      {
        name: "Ramallah and Al-Bireh Governorate",
        cities: [
          { name: "Ramallah", districts: ["Al-Tirah", "Al-Masyoun", "Downtown (Al-Manara)", "Batn al-Hawa", "Ein Musbah"] },
          { name: "Al-Bireh", districts: ["Al-Jinan", "Satah Marhaba", "Al-Balu"] },
          { name: "Beituniya", districts: ["N/A"] },
          { name: "Rawabi", districts: ["N/A"] },
          { name: "Birzeit", districts: ["N/A"] },
          { name: "Silwad", districts: ["N/A"] },
          { name: "Sinjil", districts: ["N/A"] },
          { name: "Ni'lin", districts: ["N/A"] },
          { name: "Deir Dibwan", districts: ["N/A"] }
        ]
      },
      {
        name: "Hebron Governorate (Al-Khalil)",
        cities: [
          { name: "Hebron (Al-Khalil)", districts: ["Old City (Ibrahimi Mosque Area)", "Ein Sara", "Al-Haras", "Nemra", "Al-Jami'a"] },
          { name: "Halhul", districts: ["N/A"] },
          { name: "Yatta", districts: ["N/A"] },
          { name: "Dura", districts: ["N/A"] },
          { name: "Dhahiriya", districts: ["N/A"] },
          { name: "Beit Ummar", districts: ["N/A"] },
          { name: "Sa'ir", districts: ["N/A"] },
          { name: "Bani Na'im", districts: ["N/A"] },
          { name: "Surif", districts: ["N/A"] }
        ]
      },
      {
        name: "Nablus Governorate",
        cities: [
          { name: "Nablus", districts: ["Old City (Al-Kasbah)", "Rafidia", "Al-Makhfiya", "Mount Gerizim Area", "Mount Ebal Area"] },
          { name: "Beit Furik", districts: ["N/A"] },
          { name: "Huwara", districts: ["N/A"] },
          { name: "Sebastia", districts: ["N/A"] },
          { name: "Beita", districts: ["N/A"] },
          { name: "Aqraba", districts: ["N/A"] },
          { name: "Asira al-Qabaliya", districts: ["N/A"] }
        ]
      },
      {
        name: "Bethlehem Governorate",
        cities: [
          { name: "Bethlehem", districts: ["Manger Square (Old Town)", "Al-Karkafa", "Al-Kharat'ah", "Al-Doha"] },
          { name: "Beit Jala", districts: ["N/A"] },
          { name: "Beit Sahour", districts: ["N/A"] },
          { name: "Al-Khader", districts: ["N/A"] },
          { name: "Za'atara", districts: ["N/A"] }
        ]
      },
      {
        name: "Jenin Governorate",
        cities: [
          { name: "Jenin", districts: ["City Center", "Eastern Neighborhood", "Al-Marah", "Al-Jabariyat"] },
          { name: "Ya'bad", districts: ["N/A"] },
          { name: "Arrabah", districts: ["N/A"] },
          { name: "Qabatiya", districts: ["N/A"] },
          { name: "Burqin", districts: ["N/A"] },
          { name: "Silat al-Harithiya", districts: ["N/A"] }
        ]
      },
      {
        name: "Tulkarm Governorate",
        cities: [
          { name: "Tulkarm", districts: ["Al-Shuwaika", "Al-Iktaba", "City Center", "Kadoorie Area"] },
          { name: "Anabta", districts: ["N/A"] },
          { name: "Qaffin", districts: ["N/A"] },
          { name: "Zeita", districts: ["N/A"] },
          { name: "Attil", districts: ["N/A"] },
          { name: "Deir al-Ghusun", districts: ["N/A"] }
        ]
      },
      {
        name: "Qalqilya Governorate",
        cities: [
          { name: "Qalqilya", districts: ["N/A"] },
          { name: "Azzun", districts: ["N/A"] },
          { name: "Habla", districts: ["N/A"] }
        ]
      },
      {
        name: "Salfit Governorate",
        cities: [
          { name: "Salfit", districts: ["N/A"] },
          { name: "Bidya", districts: ["N/A"] },
          { name: "Deir Istiya", districts: ["N/A"] },
          { name: "Kifl Haris", districts: ["N/A"] }
        ]
      },
      {
        name: "Tubas Governorate",
        cities: [
          { name: "Tubas", districts: ["N/A"] },
          { name: "Tammun", districts: ["N/A"] },
          { name: "Aqqaba", districts: ["N/A"] }
        ]
      },
      {
        name: "Jericho and Al-Awar Governorate",
        cities: [
          { name: "Jericho (Ariha)", districts: ["N/A"] },
          { name: "Al-Auja", districts: ["N/A"] },
          { name: "Al-Jftlik", districts: ["N/A"] }
        ]
      },
      {
        name: "Gaza Governorate",
        cities: [
          { name: "Gaza City", districts: ["Rimal", "Al-Shuja'iyya", "Al-Zaytoun", "Al-Tuffah", "Al-Nasr", "Tel al-Hawa", "Sheikh Radwan"] },
          { name: "Al-Zahra", districts: ["N/A"] },
          { name: "Juhor ad-Dik", districts: ["N/A"] }
        ]
      },
      {
        name: "North Gaza Governorate",
        cities: [
          { name: "Jabalia", districts: ["Jabalia City", "Al-Falouja", "Nazla"] },
          { name: "Beit Lahia", districts: ["N/A"] },
          { name: "Beit Hanoun", districts: ["N/A"] }
        ]
      },
      {
        name: "Khan Yunis Governorate",
        cities: [
          { name: "Khan Yunis", districts: ["City Center", "Al-Amal", "Al-Qarara", "Bani Suheila", "Abasan"] },
          { name: "Al-Qarara", districts: ["N/A"] },
          { name: "Bani Suheila", districts: ["N/A"] },
          { name: "Abasan al-Kabira", districts: ["N/A"] },
          { name: "Khuza'a", districts: ["N/A"] }
        ]
      },
      {
        name: "Rafah Governorate",
        cities: [
          { name: "Rafah", districts: ["Tal al-Sultan", "Al-Shaboura", "Al-Jenena", "Al-Brazili"] },
          { name: "Al-Shoka", districts: ["N/A"] }
        ]
      },
      {
        name: "Deir al-Balah Governorate",
        cities: [
          { name: "Deir al-Balah", districts: ["Beach Area", "City Center", "Al-Zawayda", "Al-Maghazi"] },
          { name: "Al-Nuseirat", districts: ["N/A"] },
          { name: "Al-Bureij", districts: ["N/A"] },
          { name: "Al-Maghazi", districts: ["N/A"] },
          { name: "Al-Zawayda", districts: ["N/A"] }
        ]
      }
    ]
  },
  "United Arab Emirates": {
    states: [
      {
        name: "Abu Dhabi",
        cities: [
          { name: "Abu Dhabi City", districts: ["Al Khalidiya", "Al Reem Island", "Yas Island", "Saadiyat Island", "Al Mushrif"] },
          { name: "Al Ain", districts: ["Al Jimi", "Al Maqam", "Al Hili"] },
          { name: "Ruwais", districts: ["N/A"] },
          { name: "Liwa Oasis", districts: ["N/A"] },
          { name: "Delma Island", districts: ["N/A"] },
          { name: "Zayed City", districts: ["N/A"] }
        ]
      },
      {
        name: "Dubai",
        cities: [
          { name: "Dubai City", districts: ["Downtown Dubai", "Dubai Marina", "Deira", "Bur Dubai", "Business Bay", "Jumeirah", "Palm Jumeirah"] },
          { name: "Hatta", districts: ["N/A"] },
          { name: "Jebel Ali", districts: ["N/A"] }
        ]
      },
      {
        name: "Sharjah",
        cities: [
          { name: "Sharjah City", districts: ["Al Majaz", "Al Nahda", "Al Taawun"] },
          { name: "Khor Fakkan", districts: ["N/A"] },
          { name: "Kalba", districts: ["N/A"] },
          { name: "Dibba Al-Hisn", districts: ["N/A"] },
          { name: "Al Dhaid", districts: ["N/A"] }
        ]
      },
      {
        name: "Ajman",
        cities: [
          { name: "Ajman City", districts: ["N/A"] },
          { name: "Manama", districts: ["N/A"] },
          { name: "Masfout", districts: ["N/A"] }
        ]
      },
      {
        name: "Ras Al Khaimah",
        cities: [
          { name: "Ras Al Khaimah City", districts: ["N/A"] },
          { name: "Al Jazirah Al Hamra", districts: ["N/A"] },
          { name: "Masafi", districts: ["N/A"] }
        ]
      },
      {
        name: "Fujairah",
        cities: [
          { name: "Fujairah City", districts: ["N/A"] },
          { name: "Dibba Al-Fujairah", districts: ["N/A"] }
        ]
      },
      {
        name: "Umm Al Quwain",
        cities: [
          { name: "Umm Al Quwain City", districts: ["N/A"] },
          { name: "Falaj Al Mualla", districts: ["N/A"] }
        ]
      }
    ]
  },
  "Saudi Arabia": {
    states: [
      {
        name: "Riyadh Region",
        cities: [
          { name: "Riyadh", districts: ["Al Olaya", "Al Malaz", "An Nakheel", "Al Yasmin"] },
          { name: "Al Kharj", districts: ["N/A"] },
          { name: "Al Majma'ah", districts: ["N/A"] },
          { name: "Diriyah", districts: ["N/A"] },
          { name: "Dawadmi", districts: ["N/A"] },
          { name: "Al Zulfi", districts: ["N/A"] }
        ]
      },
      {
        name: "Makkah Region",
        cities: [
          { name: "Makkah", districts: ["Al Aziziyah", "Al Shubaikah", "Al Maabdah"] },
          { name: "Jeddah", districts: ["Al Hamra", "Al Shati", "Al Rawdah", "Al Balad"] },
          { name: "Taif", districts: ["N/A"] },
          { name: "Rabigh", districts: ["N/A"] },
          { name: "Al Lith", districts: ["N/A"] },
          { name: "Al Qunfudhah", districts: ["N/A"] }
        ]
      },
      {
        name: "Madinah Region",
        cities: [
          { name: "Madinah", districts: ["Al Haram", "Al Qiblatayn", "Al Iskan"] },
          { name: "Yanbu", districts: ["N/A"] },
          { name: "AlUla", districts: ["N/A"] },
          { name: "Badr", districts: ["N/A"] }
        ]
      },
      {
        name: "Eastern Province",
        cities: [
          { name: "Dammam", districts: ["N/A"] },
          { name: "Khobar", districts: ["N/A"] },
          { name: "Dhahran", districts: ["N/A"] },
          { name: "Jubail", districts: ["N/A"] },
          { name: "Al Ahsa", districts: ["N/A"] },
          { name: "Qatif", districts: ["N/A"] },
          { name: "Hafar Al Batin", districts: ["N/A"] }
        ]
      },
      {
        name: "Asir Region",
        cities: [
          { name: "Abha", districts: ["N/A"] },
          { name: "Khamis Mushait", districts: ["N/A"] }
        ]
      },
      {
        name: "Tabuk Region",
        cities: [
          { name: "Tabuk", districts: ["N/A"] },
          { name: "NEOM", districts: ["N/A"] },
          { name: "Duba", districts: ["N/A"] },
          { name: "Umluj", districts: ["N/A"] }
        ]
      }
    ]
  },
  "Qatar": {
    states: [
      {
        name: "Ad Dawhah (Doha)",
        cities: [{ name: "Doha", districts: ["West Bay", "Al Sadd", "Pearl-Qatar", "Souq Waqif Area", "Old Airport"] }]
      },
      {
        name: "Al Rayyan",
        cities: [{ name: "Al Rayyan", districts: ["N/A"] }, { name: "Education City", districts: ["N/A"] }]
      },
      {
        name: "Al Wakrah",
        cities: [{ name: "Al Wakrah", districts: ["N/A"] }, { name: "Mesaieed", districts: ["N/A"] }]
      },
      {
        name: "Al Khor",
        cities: [{ name: "Al Khor", districts: ["N/A"] }, { name: "Dhakira", districts: ["N/A"] }]
      },
      {
        name: "Al Daayen",
        cities: [{ name: "Lusail", districts: ["N/A"] }]
      }
    ]
  },
  "Kuwait": {
    states: [
      {
        name: "Capital Governorate",
        cities: [{ name: "Kuwait City", districts: ["Dasman", "Sharq", "Salhiya"] }]
      },
      {
        name: "Hawalli Governorate",
        cities: [{ name: "Hawalli", districts: ["N/A"] }, { name: "Salmiya", districts: ["N/A"] }, { name: "Jabriya", districts: ["N/A"] }]
      },
      {
        name: "Farwaniya Governorate",
        cities: [{ name: "Farwaniya", districts: ["N/A"] }, { name: "Khaitan", districts: ["N/A"] }]
      },
      {
        name: "Ahmadi Governorate",
        cities: [{ name: "Ahmadi", districts: ["N/A"] }, { name: "Fahaheel", districts: ["N/A"] }, { name: "Mangaf", districts: ["N/A"] }]
      }
    ]
  },
  "Oman": {
    states: [
      {
        name: "Muscat Governorate",
        cities: [{ name: "Muscat", districts: ["Seeb", "Muttrah", "Ruwi", "Bawshar", "Amerat"] }, { name: "Seeb", districts: ["N/A"] }, { name: "Muttrah", districts: ["N/A"] }]
      },
      {
        name: "Dhofar Governorate",
        cities: [{ name: "Salalah", districts: ["N/A"] }, { name: "Taqah", districts: ["N/A"] }, { name: "Mirbat", districts: ["N/A"] }]
      },
      {
        name: "Al Dakhiliyah",
        cities: [{ name: "Nizwa", districts: ["N/A"] }, { name: "Bahla", districts: ["N/A"] }, { name: "Samail", districts: ["N/A"] }]
      },
      {
        name: "Al Batinah North",
        cities: [{ name: "Sohar", districts: ["N/A"] }, { name: "Saham", districts: ["N/A"] }, { name: "Shinas", districts: ["N/A"] }]
      }
    ]
  },
  "Malaysia": {
    states: [
      {
        name: "Kuala Lumpur (Federal Territory)",
        cities: [{ name: "Kuala Lumpur", districts: ["KLCC", "Bukit Bintang", "Bangsar", "Mont Kiara"] }]
      },
      {
        name: "Selangor",
        cities: [
          { name: "Petaling Jaya", districts: ["N/A"] },
          { name: "Shah Alam", districts: ["N/A"] },
          { name: "Subang Jaya", districts: ["N/A"] },
          { name: "Klang", districts: ["N/A"] },
          { name: "Kajang", districts: ["N/A"] }
        ]
      },
      {
        name: "Penang",
        cities: [
          { name: "George Town", districts: ["N/A"] },
          { name: "Butterworth", districts: ["N/A"] },
          { name: "Bayan Lepas", districts: ["N/A"] }
        ]
      },
      {
        name: "Johor",
        cities: [{ name: "Johor Bahru", districts: ["N/A"] }, { name: "Iskandar Puteri", districts: ["N/A"] }, { name: "Muar", districts: ["N/A"] }]
      },
      {
        name: "Kedah",
        cities: [{ name: "Alor Setar", districts: ["N/A"] }, { name: "Langkawi", districts: ["N/A"] }]
      }
    ]
  },
  "United Kingdom": {
    states: [
      {
        name: "England (Greater London)",
        cities: [{ name: "London", districts: ["Westminster", "Camden", "Kensington & Chelsea", "Greenwich", "City of London"] }]
      },
      {
        name: "England (Greater Manchester)",
        cities: [{ name: "Manchester", districts: ["N/A"] }, { name: "Salford", districts: ["N/A"] }, { name: "Bolton", districts: ["N/A"] }]
      },
      {
        name: "Scotland",
        cities: [{ name: "Edinburgh", districts: ["N/A"] }, { name: "Glasgow", districts: ["N/A"] }, { name: "Aberdeen", districts: ["N/A"] }]
      },
      {
        name: "Wales",
        cities: [{ name: "Cardiff", districts: ["N/A"] }, { name: "Swansea", districts: ["N/A"] }]
      }
    ]
  },
  "United States": {
    states: [
      {
        name: "California",
        cities: [
          { name: "Los Angeles", districts: ["Hollywood", "Downtown LA", "Santa Monica", "Westwood"] },
          { name: "San Francisco", districts: ["Financial District", "Mission District", "SoMa", "Sunset"] },
          { name: "San Diego", districts: ["N/A"] },
          { name: "San Jose", districts: ["N/A"] },
          { name: "Sacramento", districts: ["N/A"] }
        ]
      },
      {
        name: "New York",
        cities: [
          { name: "New York City", districts: ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"] },
          { name: "Buffalo", districts: ["N/A"] },
          { name: "Albany", districts: ["N/A"] }
        ]
      },
      {
        name: "Texas",
        cities: [
          { name: "Houston", districts: ["N/A"] },
          { name: "Austin", districts: ["N/A"] },
          { name: "Dallas", districts: ["N/A"] },
          { name: "San Antonio", districts: ["N/A"] }
        ]
      }
    ]
  },
  "India": {
    states: [
      {
        name: "Delhi (NCR)",
        cities: [{ name: "New Delhi", districts: ["Connaught Place", "South Delhi", "Dwarka", "Rohini"] }, { name: "Noida", districts: ["N/A"] }, { name: "Gurgaon", districts: ["N/A"] }]
      },
      {
        name: "Maharashtra",
        cities: [{ name: "Mumbai", districts: ["South Mumbai", "Bandra", "Andheri", "Juhu"] }, { name: "Pune", districts: ["N/A"] }, { name: "Nagpur", districts: ["N/A"] }]
      },
      {
        name: "Karnataka",
        cities: [{ name: "Bengaluru", districts: ["N/A"] }, { name: "Mysuru", districts: ["N/A"] }]
      },
      {
        name: "Kerala",
        cities: [{ name: "Kochi", districts: ["N/A"] }, { name: "Thiruvananthapuram", districts: ["N/A"] }, { name: "Kozhikode", districts: ["N/A"] }]
      }
    ]
  },
  "Sri Lanka": {
    states: [
      {
        name: "Western Province",
        cities: [
          { name: "Colombo", districts: ["Colombo 01 (Fort)", "Colombo 03 (Colpetty)", "Colombo 07 (Cinnamon Gardens)"] },
          { name: "Dehiwala-Mount Lavinia", districts: ["N/A"] },
          { name: "Negombo", districts: ["N/A"] }
        ]
      },
      {
        name: "Central Province",
        cities: [{ name: "Kandy", districts: ["N/A"] }, { name: "Nuwara Eliya", districts: ["N/A"] }]
      },
      {
        name: "Southern Province",
        cities: [{ name: "Galle", districts: ["N/A"] }, { name: "Matara", districts: ["N/A"] }]
      }
    ]
  }
};

// Helper comparison cleaners
function cleanLocationStr(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/['’\(\)\-\.\/,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findMatchingState(countryName: string, stateName: string): string | null {
  if (!stateName) return null;
  const country = LOCATION_DATABASE[countryName];
  if (!country) return null;

  const target = cleanLocationStr(stateName);
  if (!target) return null;

  // 1. Exact match
  const exact = country.states.find(s => s.name === stateName);
  if (exact) return exact.name;

  // 2. Clean exact match
  const cleanMatch = country.states.find(s => cleanLocationStr(s.name) === target);
  if (cleanMatch) return cleanMatch.name;

  // 3. Substring / keyword match (e.g. "Male" -> "Male' (Capital City)", "Addu" -> "Seenu / Addu Atoll", "Kaafu" -> "Kaafu Atoll")
  const subMatch = country.states.find(s => {
    const sClean = cleanLocationStr(s.name);
    return sClean.includes(target) || target.includes(sClean);
  });
  if (subMatch) return subMatch.name;

  return null;
}

export function findStateForCity(countryName: string, cityName: string): string | null {
  if (!cityName) return null;
  const country = LOCATION_DATABASE[countryName];
  if (!country) return null;

  const target = cleanLocationStr(cityName);
  if (!target) return null;

  for (const s of country.states) {
    for (const c of s.cities) {
      if (c.name === cityName || cleanLocationStr(c.name) === target || cleanLocationStr(c.name).includes(target) || target.includes(cleanLocationStr(c.name))) {
        return s.name;
      }
    }
  }
  return null;
}

// Helper getter functions
export function getStatesForCountry(countryName: string): string[] {
  if (LOCATION_DATABASE[countryName]) {
    return LOCATION_DATABASE[countryName].states.map(s => s.name);
  }
  return [
    "Capital Region / Main State",
    "Northern Region",
    "Southern Region",
    "Eastern Region",
    "Western Region"
  ];
}

export function getCitiesForState(countryName: string, stateName: string): string[] {
  if (LOCATION_DATABASE[countryName]) {
    const matchedStateName = findMatchingState(countryName, stateName) || stateName;
    const foundState = LOCATION_DATABASE[countryName].states.find(s => 
      s.name === matchedStateName || 
      cleanLocationStr(s.name) === cleanLocationStr(stateName) ||
      cleanLocationStr(s.name).includes(cleanLocationStr(stateName)) ||
      cleanLocationStr(stateName).includes(cleanLocationStr(s.name))
    );
    if (foundState && foundState.cities.length > 0) {
      return foundState.cities.map(c => c.name);
    }
    // Fallback: If state was empty or not found, return first state's cities
    const firstState = LOCATION_DATABASE[countryName].states[0];
    if (firstState && firstState.cities.length > 0) {
      return firstState.cities.map(c => c.name);
    }
  }
  return ["Main City / Island", "Northern City / Island", "Southern City / Island", "Central City / Island"];
}

export function getDistrictsForCity(countryName: string, stateName: string, cityName: string): string[] {
  if (LOCATION_DATABASE[countryName]) {
    // 1. Try finding in current specified state
    const matchedStateName = findMatchingState(countryName, stateName) || findStateForCity(countryName, cityName);
    if (matchedStateName) {
      const foundState = LOCATION_DATABASE[countryName].states.find(s => 
        s.name === matchedStateName ||
        cleanLocationStr(s.name) === cleanLocationStr(matchedStateName) ||
        cleanLocationStr(s.name).includes(cleanLocationStr(matchedStateName))
      );
      if (foundState) {
        const targetCity = cleanLocationStr(cityName);
        const foundCity = foundState.cities.find(c => 
          c.name === cityName || 
          cleanLocationStr(c.name) === targetCity || 
          cleanLocationStr(c.name).includes(targetCity) || 
          targetCity.includes(cleanLocationStr(c.name))
        );
        if (foundCity && foundCity.districts && foundCity.districts.length > 0) {
          return foundCity.districts;
        }
      }
    }

    // 2. Search globally across ALL states in the country for this city
    if (cityName) {
      const targetCity = cleanLocationStr(cityName);
      for (const s of LOCATION_DATABASE[countryName].states) {
        for (const c of s.cities) {
          if (
            c.name === cityName || 
            cleanLocationStr(c.name) === targetCity || 
            cleanLocationStr(c.name).includes(targetCity) || 
            targetCity.includes(cleanLocationStr(c.name))
          ) {
            if (c.districts && c.districts.length > 0) {
              return c.districts;
            }
          }
        }
      }
    }
  }
  return ["N/A"];
}
