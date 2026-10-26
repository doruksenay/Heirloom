import type { Gender } from './types';

export interface Country {
  id: string;
  name: string;
  nameTr: string;
  cities: string[];
  /** Multiplier on salaries and prices relative to the US baseline. */
  wageFactor: number;
  /** Yearly cost of living for an independent adult, in game dollars. */
  costOfLiving: number;
  /** Small shift on mortality (negative = people live longer). */
  mortalityShift: number;
  /** Display only. Game money is in US-baseline dollars; this converts it for the player's country. */
  currency: { code: string; locale: string; rate: number };
  names: { female: string[]; male: string[]; last: string[] };
}

export const COUNTRIES: Country[] = [
  {
    id: 'us',
    name: 'United States',
    nameTr: 'Amerika Birleşik Devletleri',
    cities: ['New York', 'Chicago', 'Austin', 'Seattle', 'Denver', 'Miami', 'Portland', 'Boston', 'San Diego'],
    wageFactor: 1,
    costOfLiving: 17000,
    mortalityShift: 0,
    currency: { code: 'USD', locale: 'en-US', rate: 1 },
    names: {
      female: [
        'Emma', 'Olivia', 'Ava', 'Mia', 'Harper', 'Grace', 'Chloe', 'Riley', 'Nora', 'Zoe', 'Maya', 'Lily',
        'Sophia', 'Isabella', 'Charlotte', 'Amelia', 'Evelyn', 'Abigail', 'Emily', 'Ella', 'Elizabeth', 'Camila',
        'Luna', 'Avery', 'Scarlett', 'Madison', 'Layla', 'Penelope', 'Aria', 'Hannah', 'Victoria', 'Addison',
        'Aubrey', 'Ellie', 'Stella', 'Natalie', 'Leah', 'Hazel', 'Violet', 'Aurora', 'Savannah', 'Audrey',
        'Brooklyn', 'Bella', 'Claire', 'Skylar', 'Lucy', 'Paisley', 'Anna', 'Caroline', 'Naomi', 'Ruby', 'Sadie',
      ],
      male: [
        'Liam', 'Noah', 'Mason', 'Ethan', 'Lucas', 'Caleb', 'Owen', 'Jack', 'Leo', 'Miles', 'Henry', 'Oliver',
        'James', 'Elijah', 'William', 'Benjamin', 'Theodore', 'Mateo', 'Sebastian', 'Daniel', 'Jacob', 'Michael',
        'Alexander', 'Samuel', 'Logan', 'Wyatt', 'John', 'Luke', 'Asher', 'Ezra', 'Hudson', 'Lincoln', 'Isaac',
        'Nathan', 'Aaron', 'Ryan', 'Dylan', 'Grayson', 'Julian', 'Isaiah', 'Andrew', 'Joshua', 'Christopher',
        'Gabriel', 'David', 'Joseph', 'Matthew', 'Anthony', 'Nolan', 'Adrian', 'Marcus', 'Tyler', 'Brandon',
      ],
      last: [
        'Carter', 'Brooks', 'Hayes', 'Bennett', 'Reed', 'Morgan', 'Parker', 'Foster', 'Hughes', 'Price', 'Johnson',
        'Williams', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thompson',
        'Moore', 'Martin', 'Lee', 'Walker', 'Hall', 'Young', 'King', 'Wright', 'Lopez', 'Hill', 'Green', 'Nelson',
        'Mitchell', 'Campbell', 'Turner', 'Collins', 'Rivera', 'Cooper', 'Ward', 'Kim', 'Nguyen', 'Patel',
      ],
    },
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    nameTr: 'Birleşik Krallık',
    cities: ['London', 'Manchester', 'Leeds', 'Bristol', 'Glasgow', 'Liverpool', 'Brighton', 'Edinburgh', 'Cardiff'],
    wageFactor: 0.9,
    costOfLiving: 15000,
    mortalityShift: -0.02,
    currency: { code: 'GBP', locale: 'en-GB', rate: 0.78 },
    names: {
      female: [
        'Isla', 'Amelia', 'Freya', 'Poppy', 'Evie', 'Ruby', 'Florence', 'Alice', 'Olivia', 'Ava', 'Ivy', 'Lily',
        'Mia', 'Willow', 'Rosie', 'Sophia', 'Isabella', 'Grace', 'Daisy', 'Sienna', 'Elsie', 'Emily', 'Ella',
        'Evelyn', 'Phoebe', 'Charlotte', 'Harper', 'Millie', 'Matilda', 'Isabelle', 'Maisie', 'Esme', 'Imogen',
        'Lucy', 'Chloe', 'Holly', 'Jessica', 'Hannah', 'Bethany', 'Megan', 'Lauren', 'Eleanor', 'Harriet', 'Katie',
        'Georgia', 'Amber', 'Erin', 'Abigail', 'Scarlett', 'Beatrice',
      ],
      male: [
        'Oliver', 'George', 'Harry', 'Arthur', 'Alfie', 'Freddie', 'Theo', 'Archie', 'Muhammad', 'Noah', 'Leo',
        'Oscar', 'Theodore', 'Henry', 'Charlie', 'Thomas', 'William', 'Jacob', 'Teddy', 'Finley', 'Arlo', 'Isaac',
        'Lucas', 'Edward', 'Reggie', 'Albert', 'Tommy', 'Rory', 'Louie', 'Hugo', 'Ronnie', 'Joshua', 'Max',
        'Elliot', 'Samuel', 'Daniel', 'James', 'Benjamin', 'Callum', 'Ryan', 'Liam', 'Connor', 'Jamie', 'Harrison',
        'Kieran', 'Lewis', 'Owen', 'Ethan', 'Alexander', 'Toby', 'Dylan', 'Sebastian', 'Jack',
      ],
      last: [
        'Wright', 'Thompson', 'Ellis', 'Cooper', 'Walsh', 'Hughes', 'Fletcher', 'Barnes', 'Smith', 'Jones',
        'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Robinson', 'Evans', 'Walker', 'White',
        'Roberts', 'Green', 'Hall', 'Wood', 'Clarke', 'Patel', 'Khan', 'Murphy', 'Campbell', 'Turner',
      ],
    },
  },
  {
    id: 'de',
    name: 'Germany',
    nameTr: 'Almanya',
    cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Leipzig', 'Stuttgart', 'Kiel', 'Rostock'],
    wageFactor: 0.95,
    costOfLiving: 15000,
    mortalityShift: -0.02,
    currency: { code: 'EUR', locale: 'de-DE', rate: 0.92 },
    names: {
      female: [
        'Lena', 'Mila', 'Hannah', 'Emilia', 'Lea', 'Clara', 'Marie', 'Ida', 'Mia', 'Emma', 'Sofia', 'Lina', 'Ella',
        'Leni', 'Anna', 'Luisa', 'Frieda', 'Lia', 'Mathilda', 'Johanna', 'Paula', 'Charlotte', 'Lotta', 'Greta',
        'Amelie', 'Sophie', 'Laura', 'Julia', 'Katharina', 'Sarah', 'Lisa', 'Nele', 'Maja', 'Romy', 'Helena',
        'Pia', 'Carla', 'Theresa', 'Jana', 'Antonia', 'Melina', 'Marlene', 'Ronja', 'Elisa', 'Isabell',
        'Franziska', 'Stefanie', 'Sabine', 'Nina', 'Jule',
      ],
      male: [
        'Benjamin', 'Paul', 'Finn', 'Jonas', 'Elias', 'Felix', 'Moritz', 'Luis', 'Noah', 'Matteo', 'Leon', 'Henry',
        'Luca', 'Emil', 'Theo', 'Louis', 'Anton', 'Lukas', 'Maximilian', 'Oskar', 'Liam', 'Jakob', 'David',
        'Julian', 'Niklas', 'Leo', 'Tim', 'Jan', 'Tobias', 'Florian', 'Sebastian', 'Alexander', 'Fabian',
        'Philipp', 'Simon', 'Max', 'Johannes', 'Jannik', 'Lars', 'Stefan', 'Markus', 'Andreas', 'Thomas',
        'Michael', 'Daniel', 'Karl', 'Vincent', 'Mats', 'Ole', 'Matthias',
      ],
      last: [
        'Müller', 'Schmidt', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Koch', 'Richter', 'Schneider', 'Fischer',
        'Meyer', 'Schulz', 'Schäfer', 'Bauer', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann',
        'Braun', 'Krüger', 'Hartmann', 'Lange', 'Werner',
      ],
    },
  },
  {
    id: 'tr',
    name: 'Türkiye',
    nameTr: 'Türkiye',
    cities: ['İstanbul', 'Ankara', 'İzmir', 'Zonguldak', 'Bursa', 'Antalya', 'Trabzon', 'Eskişehir', 'Mersin', 'Samsun', 'Konya'],
    wageFactor: 0.45,
    costOfLiving: 7500,
    mortalityShift: 0.01,
    currency: { code: 'TRY', locale: 'tr-TR', rate: 40 },
    names: {
      female: [
        'Zeynep', 'Elif', 'Defne', 'Ecrin', 'Ayşe', 'Selin', 'Ada', 'Nehir', 'Duru', 'Melis', 'Asya',
        'Eylül', 'Azra', 'Zehra', 'Meryem', 'Hira', 'Nisa', 'Ela', 'Lina', 'Mira', 'Ebrar', 'Ecem', 'İrem',
        'Büşra', 'Merve', 'Gizem', 'Cansu', 'Damla', 'Gamze', 'Tuğba', 'Esra', 'Seda', 'Derya', 'Ebru', 'Burcu',
        'Pınar', 'Özge', 'Didem', 'Fatma', 'Emine', 'Hatice', 'Nazlı', 'Begüm', 'İpek', 'Ceren', 'Ezgi', 'Aslı',
        'Buse', 'Yağmur', 'Sude', 'Sena', 'Hilal', 'Gül',
      ],
      male: [
        'Yusuf', 'Eymen', 'Ömer', 'Mehmet', 'Can', 'Kerem', 'Deniz', 'Emir', 'Aras', 'Burak', 'Mert', 'Alp',
        'Mustafa', 'Ahmet', 'Ali', 'Hüseyin', 'Hasan', 'İbrahim', 'Murat', 'Emre', 'Kaan', 'Efe', 'Arda', 'Berk',
        'Barış', 'Onur', 'Serkan', 'Volkan', 'Hakan', 'Tolga', 'Uğur', 'Cem', 'Oğuz', 'Selim', 'Kemal', 'Furkan',
        'Enes', 'Yiğit', 'Miraç', 'Poyraz', 'Göktuğ', 'Çınar', 'Batuhan', 'Umut', 'Halil', 'Erkan', 'Sinan',
        'Levent', 'Doruk', 'Kuzey', 'Ege', 'Baran', 'Ozan', 'Tuna', 'Görkem',
      ],
      last: [
        'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Doğan', 'Arslan', 'Aydın', 'Öztürk', 'Baba', 'Yıldız',
        'Yıldırım', 'Özdemir', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat',
        'Erdem', 'Korkmaz', 'Aksoy', 'Güneş', 'Tekin', 'Ünal', 'Acar', 'Bulut', 'Güler', 'Ateş',
      ],
    },
  },
  {
    id: 'br',
    name: 'Brazil',
    nameTr: 'Brezilya',
    cities: ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Recife', 'Curitiba', 'Fortaleza', 'Florianópolis', 'Belo Horizonte'],
    wageFactor: 0.4,
    costOfLiving: 7000,
    mortalityShift: 0.02,
    currency: { code: 'BRL', locale: 'pt-BR', rate: 5.5 },
    names: {
      female: [
        'Helena', 'Alice', 'Laura', 'Valentina', 'Sophia', 'Beatriz', 'Manuela', 'Júlia', 'Isabella', 'Heloísa',
        'Luiza', 'Lorena', 'Lívia', 'Giovanna', 'Cecília', 'Eloá', 'Lara', 'Antonella', 'Maitê', 'Liz', 'Mariana',
        'Clara', 'Isadora', 'Rafaela', 'Yasmin', 'Ana', 'Camila', 'Larissa', 'Gabriela', 'Fernanda', 'Juliana',
        'Letícia', 'Amanda', 'Bruna', 'Carolina', 'Vitória', 'Melissa', 'Nicole', 'Sarah', 'Marina', 'Bianca',
        'Lavínia', 'Esther', 'Catarina', 'Agatha', 'Aurora', 'Olívia', 'Elisa', 'Débora', 'Patrícia',
      ],
      male: [
        'Miguel', 'Arthur', 'Heitor', 'Gael', 'Davi', 'Bernardo', 'Gabriel', 'Pedro', 'Théo', 'Ravi', 'Samuel',
        'Lorenzo', 'Rafael', 'Benjamin', 'Matheus', 'Lucas', 'Nicolas', 'Guilherme', 'Isaac', 'Enzo', 'Joaquim',
        'João', 'Murilo', 'Henrique', 'Gustavo', 'Felipe', 'Bruno', 'Thiago', 'Rodrigo', 'Leonardo', 'Vinícius',
        'Caio', 'Eduardo', 'Diego', 'Fernando', 'Ricardo', 'Marcelo', 'André', 'Paulo', 'Carlos', 'Daniel',
        'Vitor', 'Otávio', 'Bento', 'Antônio', 'Francisco', 'Lucca', 'Igor', 'Fábio', 'Renato',
      ],
      last: [
        'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Almeida', 'Ferreira', 'Rodrigues',
        'Gomes', 'Ribeiro', 'Carvalho', 'Martins', 'Rocha', 'Alves', 'Araújo', 'Barbosa', 'Cardoso', 'Nascimento',
        'Moreira', 'Mendes', 'Freitas', 'Teixeira', 'Cavalcanti',
      ],
    },
  },
];

export function getCountry(id: string): Country {
  return COUNTRIES.find((c) => c.id === id) ?? COUNTRIES[0];
}

export function firstNames(countryId: string, gender: Gender): string[] {
  return getCountry(countryId).names[gender];
}
