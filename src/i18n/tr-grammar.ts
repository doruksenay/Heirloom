/**
 * Turkish suffix helpers for names inserted into sentences.
 * Proper nouns take an apostrophe before the suffix: Ada'nın, Mehmet'e, İzmir'de.
 * Vowel harmony and consonant softening rules are handled here so content can stay readable.
 */

// â and û are back vowels, î a front one (Rüzgâr'ın, Kâmil'in, Nurî'nin)
const VOWELS = 'aeıioöuüâîûAEIİOÖUÜÂÎÛ';
const BACK = 'aıouâûAIOUÂÛ';
const ROUNDED = 'oöuüûOÖUÜÛ';
const HARD = 'fstkçşhpFSTKÇŞHP'; // fıstıkçı şahap

/**
 * Names whose last syllable has a "soft l" (ince l) take front suffixes even though the vowel is back:
 * Alp'le, Alp'in, Kemal'e, Hilal'in. Compare Burak'la, Can'ın.
 */
const FRONT_EXCEPTIONS = new Set(
  ['Alp', 'Kemal', 'Cemal', 'Celal', 'Hilal', 'Bilal', 'Nihal', 'Meral', 'İkbal', 'Şevval'].map((n) =>
    n.toLocaleLowerCase('tr'),
  ),
);

function lastVowel(word: string): string {
  const lastWord = word.split(/\s+/).pop() ?? word;
  if (FRONT_EXCEPTIONS.has(lastWord.toLocaleLowerCase('tr'))) return 'e';
  for (let i = word.length - 1; i >= 0; i--) if (VOWELS.includes(word[i])) return word[i];
  return 'e';
}

/**
 * Foreign names take suffixes by how they SOUND in Turkish, not how they are spelled:
 * Alice (Alis) → Alice'i, George (Corc) → George'un, Jack (Cek) → Jack'in, Seattle (Siyetıl) → Seattle'da.
 * Covers every foreign first name and city in world.ts (tests/grammar.test.ts checks this); add new ones here.
 * Multi-word places are keyed by their last word: New York → York, Rio de Janeiro → Janeiro.
 */
export const PRONOUNCED: Record<string, string> = {
  // first names (US, UK, Germany, Brazil)
  Aaron: 'Erın', Abigail: 'Ebigeyl', Addison: 'Edisın', Adrian: 'Eydriyın', Agatha: 'Agata', Albert: 'Albırt',
  Alexander: 'Aleksandır', Alfie: 'Alfi', Alice: 'Alis', Amanda: 'Amanda', Amber: 'Embır', Amelia: 'Amilya',
  Amelie: 'Ameli', Ana: 'Ana', Andreas: 'Andreas', Andrew: 'Endru', André: 'Andre', Anna: 'Ana', Anthony: 'Entıni',
  Anton: 'Anton', Antonella: 'Antonela', Antonia: 'Antonya', Antônio: 'Antonyo', Archie: 'Arçi', Aria: 'Arya',
  Arlo: 'Arlo', Arthur: 'Artur', Asher: 'Eşır', Aubrey: 'Obri', Audrey: 'Odri', Aurora: 'Orora', Ava: 'Eyva',
  Avery: 'Eyvıri', Beatrice: 'Biyıtris', Beatriz: 'Beatris', Bella: 'Bela', Ben: 'Ben', Benjamin: 'Bencımin',
  Bento: 'Bento', Bernardo: 'Bernardo', Bethany: 'Betıni', Bianca: 'Byanka', Brandon: 'Brendın', Brooklyn: 'Bruklin',
  Bruna: 'Bruna', Bruno: 'Bruno', Caio: 'Kayo', Caleb: 'Keylıb', Callum: 'Kalım', Camila: 'Kamila', Carla: 'Karla',
  Carlos: 'Karlos', Carolina: 'Karolina', Caroline: 'Kerılayn', Catarina: 'Katarina', Cecília: 'Sesilya',
  Charlie: 'Çarli', Charlotte: 'Şarlot', Chloe: 'Kloi', Christopher: 'Kristıfır', Claire: 'Kler', Clara: 'Klara',
  Connor: 'Konır', Daisy: 'Deyzi', Daniel: 'Danyel', Davi: 'Davi', David: 'Deyvid', Diego: 'Diyego', Dylan: 'Dilın',
  Débora: 'Debora', Eduardo: 'Eduardo', Edward: 'Edvırd', Eleanor: 'Elınor', Elias: 'Elias', Elijah: 'İlayca',
  Elisa: 'Eliza', Elizabeth: 'Elizabet', Ella: 'Ela', Ellie: 'Eli', Elliot: 'Eliyıt', Eloá: 'Eloa', Elsie: 'Elsi',
  Emil: 'Emil', Emilia: 'Emilya', Emily: 'Emili', Emma: 'Ema', Enzo: 'Enzo', Erin: 'Erin', Esme: 'Ezmi',
  Esther: 'Ester', Ethan: 'İtın', Evelyn: 'Evılin', Evie: 'İvi', Ezra: 'Ezra', Fabian: 'Fabiyan', Felipe: 'Felipi',
  Felix: 'Feliks', Fernanda: 'Fernanda', Fernando: 'Fernando', Finley: 'Finli', Finn: 'Fin', Florence: 'Florıns',
  Florian: 'Floriyan', Francisco: 'Fransisko', Franziska: 'Frantsiska', Freddie: 'Fredi', Freya: 'Freya',
  Frieda: 'Frida', Fábio: 'Fabyo', Gabriel: 'Gabriyel', Gabriela: 'Gabriela', Gael: 'Gael', George: 'Corc',
  Georgia: 'Corcia', Giovanna: 'Covana', Grace: 'Greys', Grayson: 'Greysın', Greta: 'Greta', Guilherme: 'Gilyermi',
  Gustavo: 'Gustavo', Hannah: 'Hana', Harper: 'Harpır', Harriet: 'Heriyıt', Harrison: 'Herisın', Harry: 'Heri',
  Hazel: 'Heyzıl', Heitor: 'Eytor', Helena: 'Helena', Heloísa: 'Eloiza', Henrique: 'Enriki', Henry: 'Henri',
  Holly: 'Holi', Hudson: 'Hadsın', Hugo: 'Hyugo', Ida: 'İda', Igor: 'İgor', Imogen: 'İmocın', Isaac: 'Ayzık',
  Isabell: 'İzabel', Isabella: 'İzabela', Isabelle: 'İzabel', Isadora: 'İzadora', Isaiah: 'Ayzeya', Isla: 'Ayla',
  Ivy: 'Ayvi', Jack: 'Cek', Jacob: 'Ceykıb', Jakob: 'Yakob', James: 'Ceyms', Jamie: 'Ceymi', Jan: 'Yan',
  Jana: 'Yana', Jannik: 'Yanik', Jessica: 'Cesika', Joaquim: 'Joakim', Johanna: 'Yohana', Johannes: 'Yohanes',
  John: 'Con', Jonas: 'Yonas', Joseph: 'Cozıf', Joshua: 'Coşua', João: 'Joao', Jule: 'Yule', Julia: 'Yulia',
  Julian: 'Culiyın', Juliana: 'Juliana', Júlia: 'Julia', Karl: 'Karl', Katharina: 'Katarina', Katie: 'Keyti',
  Kieran: 'Kirın', Lara: 'Lara', Larissa: 'Larisa', Lars: 'Lars', Laura: 'Laura', Lauren: 'Lorın',
  Lavínia: 'Lavinya', Layla: 'Leyla', Lea: 'Lea', Leah: 'Liya', Lena: 'Lena', Leni: 'Leni', Leo: 'Liyo',
  Leon: 'Leon', Leonardo: 'Leonardo', Letícia: 'Letisya', Lewis: 'Luis', Lia: 'Lia', Liam: 'Liyım', Lily: 'Lili',
  Lina: 'Lina', Lincoln: 'Linkın', Lisa: 'Liza', Liz: 'Liz', Logan: 'Logın', Lorena: 'Lorena', Lorenzo: 'Lorenzo',
  Lotta: 'Lota', Louie: 'Lui', Louis: 'Lui', Luca: 'Luka', Lucas: 'Lukas', Lucca: 'Luka', Lucy: 'Lusi', Luis: 'Luis',
  Luisa: 'Luiza', Luiza: 'Luiza', Lukas: 'Lukas', Luke: 'Luk', Luna: 'Luna', Lívia: 'Livya', Madison: 'Medisın',
  Maisie: 'Meyzi', Maitê: 'Mayte', Maja: 'Maya', Manuela: 'Manuela', Marcelo: 'Marselo', Marcus: 'Markıs',
  Mariana: 'Mariana', Marie: 'Mari', Marina: 'Marina', Markus: 'Markus', Marlene: 'Marlene', Mason: 'Meysın',
  Mateo: 'Mateo', Matheus: 'Mateus', Mathilda: 'Matilda', Matilda: 'Matilda', Mats: 'Mats', Matteo: 'Mateo',
  Matthew: 'Metyu', Matthias: 'Matias', Max: 'Maks', Maximilian: 'Maksimilyan', Maya: 'Maya', Megan: 'Megın',
  Melina: 'Melina', Melissa: 'Melisa', Mia: 'Mia', Michael: 'Maykıl', Miguel: 'Migel', Mila: 'Mila', Miles: 'Mayls',
  Millie: 'Mili', Moritz: 'Morits', Muhammad: 'Muhammad', Murilo: 'Murilo', Naomi: 'Neyomi', Natalie: 'Netıli',
  Nathan: 'Neytın', Nele: 'Nele', Nicolas: 'Nikolas', Nicole: 'Nikol', Niklas: 'Niklas', Nina: 'Nina', Noah: 'Nova',
  Nolan: 'Noulın', Nora: 'Nora', Ole: 'Ole', Oliver: 'Olivır', Olivia: 'Olivya', Olívia: 'Olivya', Oscar: 'Oskır',
  Oskar: 'Oskar', Otávio: 'Otavyo', Owen: 'Ovın', Paisley: 'Peyzli', Patrícia: 'Patrisya', Paul: 'Paul',
  Paula: 'Paula', Paulo: 'Paulo', Pedro: 'Pedro', Penelope: 'Penelopi', Philipp: 'Filip', Phoebe: 'Fibi', Pia: 'Pia',
  Poppy: 'Popi', Rafael: 'Rafael', Rafaela: 'Rafaela', Ravi: 'Ravi', Reggie: 'Reci', Renato: 'Renato',
  Ricardo: 'Rikardo', Riley: 'Rayli', Rodrigo: 'Rodrigo', Romy: 'Romi', Ronja: 'Ronya', Ronnie: 'Roni', Rory: 'Rori',
  Rosie: 'Rozi', Ruby: 'Rubi', Ryan: 'Rayın', Sabine: 'Zabine', Sadie: 'Seydi', Samuel: 'Samuel', Sarah: 'Sara',
  Savannah: 'Sıvena', Scarlett: 'Skarlıt', Sebastian: 'Sebastiyan', Sienna: 'Siyena', Simon: 'Zimon',
  Skylar: 'Skaylır', Sofia: 'Sofia', Sophia: 'Sofiya', Sophie: 'Sofi', Stefan: 'Ştefan', Stefanie: 'Ştefani',
  Stella: 'Stela', Teddy: 'Tedi', Theo: 'Tiyo', Theodore: 'Tiyodor', Theresa: 'Tereza', Thiago: 'Çiago',
  Thomas: 'Tomas', Théo: 'Teo', Tim: 'Tim', Tobias: 'Tobias', Toby: 'Tobi', Tommy: 'Tomi', Tyler: 'Taylır',
  Valentina: 'Valentina', Victoria: 'Viktorya', Vincent: 'Vinsent', Vinícius: 'Vinisyus', Violet: 'Vayılıt',
  Vitor: 'Vitor', Vitória: 'Vitorya', William: 'Vilyım', Willow: 'Vilo', Wyatt: 'Vayıt', Yasmin: 'Yasmin',
  Zoe: 'Zoi',
  // pet names (src/engine/pets.ts) that are not already above
  Atlas: 'Atlas', Bailey: 'Beyli', Biscuit: 'Biskit', Bubbles: 'Babılz', Buddy: 'Badi', Bunny: 'Bani', Cleo: 'Kliyo',
  Clover: 'Klovır', Coco: 'Koko', Dory: 'Dori', Franklin: 'Frenklin', Goldie: 'Goldi', Kiwi: 'Kivi', Mango: 'Mengo',
  Maple: 'Meypıl', Milo: 'Maylo', Nemo: 'Nimo', Ninja: 'Ninca', Pip: 'Pip', Rocky: 'Roki', Sheldon: 'Şeldın',
  Simba: 'Simba', Snowball: 'Snobol', Spirit: 'Spirit', Storm: 'Storm', Sunny: 'Sani', Thumper: 'Tampır',
  Whiskers: 'Viskırs',
  // cities
  Austin: 'Ostin', Berlin: 'Berlin', Boston: 'Bostın', Brighton: 'Braytın', Bristol: 'Bristıl', Cardiff: 'Kardif',
  Chicago: 'Şikago', Cologne: 'Kolon', Curitiba: 'Kuriçiba', Denver: 'Denvır', Edinburgh: 'Edinburg',
  Florianópolis: 'Floriyanopolis', Fortaleza: 'Fortaleza', Glasgow: 'Glazgo', Hamburg: 'Hamburg',
  Horizonte: 'Orizonçi', Janeiro: 'Janeyro', Kiel: 'Kil', Leeds: 'Lids', Leipzig: 'Laypsig', Liverpool: 'Livırpul',
  London: 'Lındın', Manchester: 'Mençıstır', Miami: 'Mayami', Munich: 'Myunik', Portland: 'Portlınd',
  Recife: 'Resifi', Rostock: 'Rostok', Salvador: 'Salvador', Seattle: 'Siyetıl', Stuttgart: 'Ştutgart', York: 'York',
  // first names (France, Spain, Italy, Netherlands, Canada, Mexico, Japan)
  Louise: 'Luiz', Chloé: 'Kloe', Inès: 'İnes', Léa: 'Lea', Manon: 'Manon', Camille: 'Kamiy', Jade: 'Jad',
  Rose: 'Roz', Juliette: 'Jülyet', Lou: 'Lu', Zoé: 'Zoe', Léna: 'Lena', Agathe: 'Agat', Margaux: 'Margo',
  Clémence: 'Klemans', Élise: 'Eliz', Victoire: 'Viktuar', Adèle: 'Adel', Romane: 'Roman', Lucie: 'Lüsi',
  Pauline: 'Polin', Mathilde: 'Matild', Marion: 'Maryon', Céline: 'Selin', Nathalie: 'Natali', Aurélie: 'Oreli',
  Émilie: 'Emili', Hélène: 'Elen', Margot: 'Margo', Eva: 'Eva', Constance: 'Konstans', Elsa: 'Elsa',
  Capucine: 'Kapüsin', Héloïse: 'Eloiz', Apolline: 'Apolin', Joséphine: 'Jozefin', Valentine: 'Valantin',
  Gabrielle: 'Gabriyel', Léonie: 'Leoni', Anaïs: 'Anais', Maëlys: 'Maelis', Brigitte: 'Brijit', Sylvie: 'Silvi',
  Valérie: 'Valeri', Raphaël: 'Rafael', Jules: 'Jül', Adam: 'Adam', Léo: 'Leo', Maël: 'Mael', Noé: 'Noe',
  Sacha: 'Saşa', Tom: 'Tom', Mathis: 'Matis', Victor: 'Viktor', Timothée: 'Timote', Baptiste: 'Batist',
  Antoine: 'Antuan', Maxime: 'Maksim', Alexandre: 'Aleksandr', Clément: 'Kleman', Julien: 'Jülyen', Pierre: 'Piyer',
  Étienne: 'Etyen', Mathieu: 'Matyö', Guillaume: 'Giyom', Romain: 'Romen', Benoît: 'Benua', François: 'Fransua',
  Olivier: 'Olivye', Laurent: 'Loran', Philippe: 'Filip', Thierry: 'Tieri', Jean: 'Jan', Marius: 'Maryüs',
  Gaspard: 'Gaspar', Valentin: 'Valanten', Axel: 'Aksel', Sébastien: 'Sebastyen', Bastien: 'Bastyen',
  Florent: 'Floran', Cédric: 'Sedrik', Lucien: 'Lüsyen', Augustin: 'Ogüsten', Émile: 'Emil', Lucía: 'Lusia',
  Sofía: 'Sofia', Martina: 'Martina', María: 'Maria', Valeria: 'Valerya', Daniela: 'Daniela', Alba: 'Alba',
  Noa: 'Noa', Alma: 'Alma', Sara: 'Sara', Carmen: 'Karmen', Vega: 'Vega', Lola: 'Lola', Elena: 'Elena',
  Jimena: 'Himena', Claudia: 'Klaudya', Aitana: 'Aytana', Irene: 'İrene', Marta: 'Marta', Cristina: 'Kristina',
  Nuria: 'Nurya', Pilar: 'Pilar', Rocío: 'Rosio', Begoña: 'Begonya', Ainhoa: 'Aynoa', Inés: 'İnes', Blanca: 'Blanka',
  Lidia: 'Lidya', Raquel: 'Rakel', Silvia: 'Silvya', Isabel: 'İsabel', Alicia: 'Alisya', Candela: 'Kandela',
  Triana: 'Triyana', Abril: 'Abril', Leire: 'Leyre', Mercedes: 'Mersedes', Martín: 'Martin', Alejandro: 'Alehandro',
  Manuel: 'Manuel', Pablo: 'Pablo', Álvaro: 'Alvaro', Adrián: 'Adriyan', Mario: 'Maryo', Javier: 'Haviyer',
  Marcos: 'Markos', Sergio: 'Serhyo', Jorge: 'Horhe', Antonio: 'Antonyo', José: 'Hose', Juan: 'Huan', Iker: 'İker',
  Gonzalo: 'Gonsalo', Rubén: 'Ruben', Íñigo: 'İnyigo', Unai: 'Unay', Nicolás: 'Nikolas', Izan: 'İsan',
  Aitor: 'Aytor', Óscar: 'Oskar', Raúl: 'Raul', Alberto: 'Alberto', Jaime: 'Hayme', Guillermo: 'Giyermo',
  Ignacio: 'İgnasyo', Víctor: 'Viktor', Andrés: 'Andres', Joaquín: 'Hoakin', Giulia: 'Culya', Ginevra: 'Cinevra',
  Vittoria: 'Vittorya', Ludovica: 'Ludovika', Matilde: 'Matilde', Camilla: 'Kamilla', Chiara: 'Kyara',
  Giorgia: 'Corca', Gaia: 'Gaya', Francesca: 'Françeska', Alessia: 'Alessya', Federica: 'Federika', Paola: 'Paola',
  Giada: 'Cada', Arianna: 'Aryanna', Serena: 'Serena', Rebecca: 'Rebekka', Noemi: 'Noemi', Viola: 'Vyola',
  Benedetta: 'Benedetta', Caterina: 'Katerina', Lucia: 'Luçia', Ilaria: 'İlarya', Roberta: 'Roberta',
  Simona: 'Simona', Lorenza: 'Lorentsa', Rachele: 'Rakele', Carlotta: 'Karlotta', Margherita: 'Margerita',
  Angela: 'Ancela', Francesco: 'Françesko', Alessandro: 'Alessandro', Mattia: 'Mattia', Tommaso: 'Tommazo',
  Gabriele: 'Gabriele', Andrea: 'Andrea', Riccardo: 'Rikkardo', Edoardo: 'Edoardo', Giuseppe: 'Cuseppe',
  Federico: 'Federiko', Pietro: 'Piyetro', Giovanni: 'Covanni', Filippo: 'Filippo', Niccolò: 'Nikkolo',
  Davide: 'Davide', Marco: 'Marko', Simone: 'Simone', Stefano: 'Stefano', Paolo: 'Paolo', Giorgio: 'Corco',
  Massimo: 'Massimo', Fabio: 'Fabyo', Roberto: 'Roberto', Salvatore: 'Salvatore', Vincenzo: 'Vinçenzo',
  Emanuele: 'Emanuele', Michele: 'Mikele', Samuele: 'Samuele', Enea: 'Enea', Elia: 'Elia', Daniele: 'Daniele',
  Raffaele: 'Raffaele', Gianluca: 'Canluka', Carlo: 'Karlo', Luigi: 'Luici', Franco: 'Franko', Dario: 'Daryo',
  Claudio: 'Klaudyo', Tess: 'Tes', Zoë: 'Zoe', Yara: 'Yara', Liv: 'Liv', Lotte: 'Lotte', Saar: 'Sar', Evi: 'Evi',
  Noor: 'Nor', Fenna: 'Fenna', Lieke: 'Like', Fleur: 'Flör', Isa: 'İsa', Roos: 'Ros', Femke: 'Femke', Sanne: 'Sanne',
  Esmee: 'Esme', Ilse: 'İlse', Iris: 'İris', Merel: 'Merel', Floor: 'Flor', Elin: 'Elin', Jasmijn: 'Yasmeyn',
  Lynn: 'Lin', Vera: 'Vera', Anouk: 'Anuk', Marieke: 'Marike', Ingrid: 'İngrid', Willemijn: 'Vilemeyn',
  Annelies: 'Anelis', Tessa: 'Tesa', Sterre: 'Sterre', Bente: 'Bente', Feline: 'Feline', Lieve: 'Live', Sem: 'Sem',
  Daan: 'Dan', Levi: 'Levi', Luuk: 'Lük', Mees: 'Mes', Milan: 'Milan', Sam: 'Sam', Bram: 'Bram', Jesse: 'Yese',
  Thijs: 'Teys', Siem: 'Sim', Jens: 'Yens', Ties: 'Tis', Gijs: 'Heys', Teun: 'Tön', Ruben: 'Rüben', Stijn: 'Steyn',
  Jasper: 'Yasper', Daniël: 'Danyel', Joep: 'Yup', Floris: 'Floris', Wouter: 'Vauter', Bas: 'Bas', Pieter: 'Piter',
  Jeroen: 'Yerun', Sander: 'Sander', Koen: 'Kun', Maarten: 'Marten', Niels: 'Nils', Rik: 'Rik', Joris: 'Yoris',
  Willem: 'Vilem', Hendrik: 'Hendrik', Dirk: 'Dirk', Kees: 'Kes', Joost: 'Yost', Tijn: 'Teyn', Rosalie: 'Rozali',
  Kayla: 'Keyla', Brooke: 'Bruk', Paige: 'Peyc', Félix: 'Feliks', Kyle: 'Kayl', Cody: 'Kodi', Wayne: 'Veyn',
  Marc: 'Mark', Alexis: 'Aleksis', Justin: 'Castin', Kevin: 'Kevin', Patrick: 'Petrik', Regina: 'Rehina',
  Ximena: 'Himena', Renata: 'Renata', Natalia: 'Natalya', Guadalupe: 'Guadalupe', Alejandra: 'Alehandra',
  Romina: 'Romina', Itzel: 'İtsel', Montserrat: 'Montserrat', Rosa: 'Rosa', Patricia: 'Patrisya',
  Verónica: 'Veronika', Adriana: 'Adriyana', Mónica: 'Monika', Brenda: 'Brenda', Karla: 'Karla', Diana: 'Diyana',
  Fátima: 'Fatima', Luciana: 'Lusiana', Paulina: 'Paulina', Esmeralda: 'Esmeralda', Yolanda: 'Yolanda',
  Leticia: 'Letisya', Araceli: 'Araseli', Marisol: 'Marisol', Santiago: 'Santiyago', Sebastián: 'Sebastiyan',
  Matías: 'Matias', Emiliano: 'Emilyano', Jesús: 'Hesus', Emilio: 'Emilyo', Héctor: 'Ektor', Arturo: 'Arturo',
  Ángel: 'Anhel', Iván: 'İvan', Ernesto: 'Ernesto', Ramón: 'Ramon', Armando: 'Armando', Enrique: 'Enrike',
  Tadeo: 'Tadeo', Maximiliano: 'Maksimilyano', Yui: 'Yui', Hina: 'Hina', Sakura: 'Sakura', Yuna: 'Yuna', Aoi: 'Aoi',
  Rin: 'Rin', Mio: 'Mio', Himari: 'Himari', Riko: 'Riko', Saki: 'Saki', Haruka: 'Haruka', Nanami: 'Nanami',
  Misaki: 'Misaki', Yuka: 'Yuka', Ayaka: 'Ayaka', Yoko: 'Yoko', Keiko: 'Keyko', Naoko: 'Naoko', Tomoko: 'Tomoko',
  Akiko: 'Akiko', Emi: 'Emi', Kana: 'Kana', Momoka: 'Momoka', Kokona: 'Kokona', Tsumugi: 'Tsumugi', Ema: 'Ema',
  Akari: 'Akari', Hana: 'Hana', Yuzuki: 'Yuzuki', Koharu: 'Koharu', Mitsuki: 'Mitsuki', Asuka: 'Asuka',
  Chihiro: 'Çihiro', Nozomi: 'Nozomi', Megumi: 'Megumi', Kaori: 'Kaori', Miyu: 'Miyu', Rina: 'Rina', Erika: 'Erika',
  Mayu: 'Mayu', Natsuki: 'Natsuki', Sayaka: 'Sayaka', Shiori: 'Şiori', Fumiko: 'Fumiko', Hinako: 'Hinako',
  Haruto: 'Haruto', Sota: 'Sota', Ren: 'Ren', Yuto: 'Yuto', Minato: 'Minato', Riku: 'Riku', Hinata: 'Hinata',
  Itsuki: 'İtsuki', Yuki: 'Yuki', Hiroshi: 'Hiroşi', Takashi: 'Takaşi', Kenji: 'Kenci', Kenta: 'Kenta',
  Daiki: 'Daiki', Shota: 'Şota', Kaito: 'Kaito', Sora: 'Sora', Hayato: 'Hayato', Yamato: 'Yamato', Takumi: 'Takumi',
  Ryota: 'Ryota', Kazuki: 'Kazuki', Yusuke: 'Yusuke', Daisuke: 'Daysuke', Shun: 'Şun', Taiga: 'Tayga', Yuma: 'Yuma',
  Kosuke: 'Kosuke', Takeshi: 'Takeşi', Satoshi: 'Satoşi', Akira: 'Akira', Makoto: 'Makoto', Naoki: 'Naoki',
  Ryo: 'Ryo', Tatsuya: 'Tatsuya', Kenichi: 'Keniçi', Masato: 'Masato', Tomoya: 'Tomoya', Haruki: 'Haruki', Sho: 'Şo',
  Ichiro: 'İçiro', Jiro: 'Ciro', Osamu: 'Osamu', Isamu: 'İsamu', Hideo: 'Hideo', Kazuo: 'Kazuo',
  // cities (France, Spain, Italy, Netherlands, Canada, Mexico, Japan); Turkish exonyms (Roma, Lahey) are in engine/places.ts
  Paris: 'Paris', Lyon: 'Liyon', Toulouse: 'Tuluz', Nice: 'Nis', Nantes: 'Nant', Bordeaux: 'Bordo', Lille: 'Lil',
  Montpellier: 'Monpelye', Madrid: 'Madrid', Valencia: 'Valensiya', Bilbao: 'Bilbao', Málaga: 'Malaga',
  Zaragoza: 'Saragosa', Granada: 'Granada', Palma: 'Palma', Alicante: 'Alikante', Bologna: 'Bolonya',
  Palermo: 'Palermo', Bari: 'Bari', Verona: 'Verona', Amsterdam: 'Amsterdam', Rotterdam: 'Rotterdam',
  Utrecht: 'Utreht', Eindhoven: 'Ayndhovın', Groningen: 'Hroningen', Haarlem: 'Harlem', Leiden: 'Leyden',
  Maastricht: 'Mastriht', Nijmegen: 'Neymehen', Toronto: 'Toronto', Montreal: 'Montreal', Vancouver: 'Vankuvır',
  Calgary: 'Kelgıri', Ottawa: 'Otava', Edmonton: 'Edmıntın', Quebec: 'Kebek', Winnipeg: 'Vinipeg',
  Halifax: 'Halifaks', Guadalajara: 'Guadalahara', Monterrey: 'Monterey', Puebla: 'Puebla', Cancún: 'Kankun',
  Oaxaca: 'Vahaka', Mérida: 'Merida', Tijuana: 'Tihuana', Veracruz: 'Verakrus', Acapulco: 'Akapulko', Tokyo: 'Tokyo',
  Osaka: 'Osaka', Kyoto: 'Kyoto', Yokohama: 'Yokohama', Sapporo: 'Sapporo', Fukuoka: 'Fukuoka', Nagoya: 'Nagoya',
  Kobe: 'Kobe', Sendai: 'Sendai', Hiroshima: 'Hiroşima', Nagasaki: 'Nagasaki',
};

/**
 * How the end of a name sounds. Known foreign names use PRONOUNCED; English names ending in
 * consonant + "y" end in an "i" sound (Ruby → Ruby'nin, Emily'yle), while Turkish names like Kutay keep their "y".
 */
const spoken = (w: string) => {
  const lastWord = w.split(/\s+/).pop() ?? w;
  if (PRONOUNCED[lastWord]) return PRONOUNCED[lastWord];
  return /[^aeiouAEIOUıİöÖüÜ]y$/.test(w) ? w.slice(0, -1) + 'i' : w;
};
const endsWithVowel = (w: string) => VOWELS.includes(spoken(w).slice(-1));
const endsHard = (w: string) => HARD.includes(spoken(w).slice(-1));

/** 4-way harmony vowel: ı i u ü */
function v4(word: string): string {
  const v = lastVowel(spoken(word));
  const back = BACK.includes(v);
  const round = ROUNDED.includes(v);
  return back ? (round ? 'u' : 'ı') : round ? 'ü' : 'i';
}

/** 2-way harmony vowel: a e */
const v2 = (word: string) => (BACK.includes(lastVowel(spoken(word))) ? 'a' : 'e');

/** Genitive: Ada'nın, Mehmet'in, Ayşe'nin */
export const gen = (name: string) => `${name}'${endsWithVowel(name) ? 'n' : ''}${v4(name)}n`;
/** Accusative: Ada'yı, Mehmet'i */
export const acc = (name: string) => `${name}'${endsWithVowel(name) ? 'y' : ''}${v4(name)}`;
/** Dative: Ada'ya, Mehmet'e */
export const dat = (name: string) => `${name}'${endsWithVowel(name) ? 'y' : ''}${v2(name)}`;
/** Locative: İzmir'de, Zonguldak'ta, Ada'da */
export const loc = (name: string) => `${name}'${endsHard(name) ? 't' : 'd'}${v2(name)}`;
/** Ablative: İzmir'den, Zonguldak'tan */
export const abl = (name: string) => `${name}'${endsHard(name) ? 't' : 'd'}${v2(name)}n`;
/** Comitative: Ada'yla, Mehmet'le (written as a suffix) */
export const wth = (name: string) => `${name}'${endsWithVowel(name) ? 'y' : ''}l${v2(name)}`;

/**
 * The separate particle "de/da" ("too", "and"), written apart and never softened: Gizem de, Emre de, Pamuk da, Carlos da.
 * Returns the name with the particle: `${da(name)} öyle.` → "Gizem de öyle."
 */
export const da = (name: string) => `${name} ${v2(name)}`.replace(/ a$/, ' da').replace(/ e$/, ' de');
