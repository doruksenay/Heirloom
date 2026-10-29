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
  {
    id: 'fr',
    name: 'France',
    nameTr: 'Fransa',
    cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Bordeaux', 'Lille', 'Strasbourg', 'Montpellier'],
    wageFactor: 0.85,
    costOfLiving: 14000,
    mortalityShift: -0.02,
    currency: { code: 'EUR', locale: 'fr-FR', rate: 0.92 },
    names: {
      female: [
        'Louise', 'Alice', 'Chloé', 'Inès', 'Léa', 'Manon', 'Camille', 'Jade', 'Lina', 'Rose', 'Anna', 'Juliette',
        'Lou', 'Zoé', 'Mila', 'Léna', 'Agathe', 'Margaux', 'Clémence', 'Élise', 'Charlotte', 'Victoire', 'Adèle',
        'Romane', 'Lucie', 'Sarah', 'Pauline', 'Mathilde', 'Marion', 'Céline', 'Nathalie', 'Sophie', 'Isabelle',
        'Aurélie', 'Émilie', 'Hélène', 'Margot', 'Eva', 'Constance', 'Elsa', 'Capucine', 'Héloïse', 'Apolline',
        'Joséphine', 'Valentine', 'Gabrielle', 'Léonie', 'Anaïs', 'Maëlys', 'Brigitte', 'Sylvie', 'Valérie',
      ],
      male: [
        'Gabriel', 'Louis', 'Raphaël', 'Jules', 'Adam', 'Arthur', 'Hugo', 'Léo', 'Maël', 'Noé', 'Sacha', 'Paul',
        'Tom', 'Mathis', 'Victor', 'Timothée', 'Baptiste', 'Antoine', 'Maxime', 'Alexandre', 'Clément', 'Julien',
        'Pierre', 'Étienne', 'Mathieu', 'Guillaume', 'Romain', 'Benoît', 'François', 'Olivier', 'Laurent',
        'Philippe', 'Thierry', 'Jean', 'Marius', 'Gaspard', 'Valentin', 'Axel', 'Sébastien', 'Bastien', 'Florent',
        'Cédric', 'Lucien', 'Augustin', 'Émile', 'Nathan', 'Théo', 'Ethan',
      ],
      last: [
        'Martin', 'Bernard', 'Dubois', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Lefebvre',
        'Michel', 'Garcia', 'Bertrand', 'Roux', 'Fournier', 'Morel', 'Girard', 'Mercier', 'Dupont', 'Lambert',
        'Bonnet', 'Fontaine', 'Rousseau', 'Chevalier', 'Faure',
      ],
    },
  },
  {
    id: 'es',
    name: 'Spain',
    nameTr: 'İspanya',
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Málaga', 'Zaragoza', 'Granada', 'Palma', 'Alicante'],
    wageFactor: 0.65,
    costOfLiving: 11000,
    mortalityShift: -0.03,
    currency: { code: 'EUR', locale: 'es-ES', rate: 0.92 },
    names: {
      female: [
        'Lucía', 'Sofía', 'Martina', 'María', 'Julia', 'Paula', 'Valeria', 'Emma', 'Daniela', 'Carla', 'Alba', 'Noa',
        'Alma', 'Olivia', 'Sara', 'Carmen', 'Vega', 'Lola', 'Valentina', 'Elena', 'Jimena', 'Claudia', 'Aitana',
        'Irene', 'Laura', 'Marta', 'Cristina', 'Nuria', 'Pilar', 'Rocío', 'Begoña', 'Ainhoa', 'Inés', 'Blanca',
        'Lidia', 'Raquel', 'Silvia', 'Beatriz', 'Ana', 'Isabel', 'Alicia', 'Candela', 'Triana', 'Abril', 'Leire',
        'Mercedes',
      ],
      male: [
        'Hugo', 'Martín', 'Mateo', 'Lucas', 'Leo', 'Daniel', 'Alejandro', 'Manuel', 'Pablo', 'Álvaro', 'Adrián',
        'Enzo', 'Mario', 'Diego', 'David', 'Javier', 'Marcos', 'Sergio', 'Jorge', 'Carlos', 'Antonio', 'José', 'Juan',
        'Miguel', 'Iker', 'Gonzalo', 'Rubén', 'Íñigo', 'Bruno', 'Thiago', 'Nicolás', 'Izan', 'Aitor', 'Óscar',
        'Rafael', 'Fernando', 'Raúl', 'Alberto', 'Jaime', 'Guillermo', 'Ignacio', 'Rodrigo', 'Víctor', 'Andrés',
        'Pedro', 'Luis', 'Joaquín',
      ],
      last: [
        'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Jiménez',
        'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro',
        'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Serrano', 'Molina',
      ],
    },
  },
  {
    id: 'it',
    name: 'Italy',
    nameTr: 'İtalya',
    cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Venice', 'Bologna', 'Genoa', 'Palermo', 'Bari', 'Verona'],
    wageFactor: 0.7,
    costOfLiving: 12000,
    mortalityShift: -0.03,
    currency: { code: 'EUR', locale: 'it-IT', rate: 0.92 },
    names: {
      female: [
        'Sofia', 'Aurora', 'Giulia', 'Ginevra', 'Vittoria', 'Ludovica', 'Emma', 'Matilde', 'Anna', 'Camilla', 'Chiara',
        'Giorgia', 'Bianca', 'Gaia', 'Martina', 'Francesca', 'Alessia', 'Sara', 'Elena', 'Valentina', 'Federica',
        'Silvia', 'Paola', 'Elisa', 'Laura', 'Giada', 'Arianna', 'Serena', 'Rebecca', 'Noemi', 'Greta', 'Viola',
        'Benedetta', 'Caterina', 'Lucia', 'Marta', 'Ilaria', 'Roberta', 'Simona', 'Cristina', 'Lorenza', 'Rachele',
        'Carlotta', 'Margherita', 'Irene', 'Angela',
      ],
      male: [
        'Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Tommaso', 'Gabriele', 'Andrea', 'Riccardo',
        'Edoardo', 'Matteo', 'Giuseppe', 'Antonio', 'Federico', 'Diego', 'Pietro', 'Giovanni', 'Filippo', 'Niccolò',
        'Davide', 'Marco', 'Luca', 'Simone', 'Stefano', 'Paolo', 'Giorgio', 'Massimo', 'Fabio', 'Roberto',
        'Salvatore', 'Vincenzo', 'Emanuele', 'Michele', 'Samuele', 'Alberto', 'Enea', 'Elia', 'Daniele', 'Raffaele',
        'Gianluca', 'Carlo', 'Luigi', 'Franco', 'Sergio', 'Dario', 'Claudio',
      ],
      last: [
        'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Gallo',
        'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana',
        'Santoro', 'Mariani', 'Rinaldi', 'Caruso',
      ],
    },
  },
  {
    id: 'nl',
    name: 'Netherlands',
    nameTr: 'Hollanda',
    cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen', 'Haarlem', 'Leiden', 'Maastricht', 'Nijmegen'],
    wageFactor: 1,
    costOfLiving: 16000,
    mortalityShift: -0.02,
    currency: { code: 'EUR', locale: 'nl-NL', rate: 0.92 },
    names: {
      female: [
        'Emma', 'Julia', 'Mila', 'Tess', 'Sophie', 'Zoë', 'Sara', 'Nora', 'Yara', 'Eva', 'Liv', 'Lotte', 'Saar', 'Evi',
        'Noor', 'Fenna', 'Lieke', 'Anna', 'Fleur', 'Isa', 'Roos', 'Femke', 'Sanne', 'Lisa', 'Esmee', 'Ilse', 'Iris',
        'Merel', 'Floor', 'Nina', 'Elin', 'Jasmijn', 'Lynn', 'Vera', 'Anouk', 'Marieke', 'Ingrid', 'Willemijn',
        'Annelies', 'Tessa', 'Sterre', 'Bente', 'Feline', 'Lieve',
      ],
      male: [
        'Noah', 'Sem', 'Liam', 'Lucas', 'Daan', 'Finn', 'Levi', 'Luuk', 'Mees', 'Milan', 'Sam', 'Bram', 'Jesse',
        'Thijs', 'Siem', 'Jens', 'Ties', 'Gijs', 'Teun', 'Ruben', 'Stijn', 'Lars', 'Jasper', 'Tim', 'Max', 'Daniël',
        'Joep', 'Mats', 'Floris', 'Wouter', 'Bas', 'Pieter', 'Jeroen', 'Sander', 'Koen', 'Maarten', 'Niels', 'Rik',
        'Joris', 'Willem', 'Hendrik', 'Dirk', 'Kees', 'Joost', 'Tijn',
      ],
      last: [
        'de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer',
        'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer',
        'de Wit', 'Dijkstra', 'Smits', 'de Graaf', 'van der Meer',
      ],
    },
  },
  {
    id: 'ca',
    name: 'Canada',
    nameTr: 'Kanada',
    cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton', 'Quebec City', 'Winnipeg', 'Halifax', 'Victoria'],
    wageFactor: 0.9,
    costOfLiving: 16000,
    mortalityShift: -0.02,
    currency: { code: 'CAD', locale: 'en-CA', rate: 1.37 },
    names: {
      female: [
        'Olivia', 'Emma', 'Charlotte', 'Amelia', 'Sophia', 'Chloe', 'Ava', 'Mia', 'Alice', 'Léa', 'Florence', 'Rosalie',
        'Zoé', 'Juliette', 'Abigail', 'Emily', 'Hannah', 'Madison', 'Avery', 'Ella', 'Lily', 'Grace', 'Nora', 'Isla',
        'Ellie', 'Scarlett', 'Hazel', 'Stella', 'Claire', 'Sarah', 'Jessica', 'Megan', 'Lauren', 'Kayla', 'Brooke',
        'Paige', 'Camille', 'Léonie', 'Gabrielle', 'Jade', 'Victoria', 'Audrey', 'Naomi', 'Maya',
      ],
      male: [
        'Liam', 'Noah', 'William', 'Benjamin', 'Lucas', 'Oliver', 'Jack', 'Ethan', 'Logan', 'Leo', 'Thomas', 'Jacob',
        'Owen', 'Nathan', 'Samuel', 'Gabriel', 'Félix', 'Raphaël', 'Louis', 'Jules', 'Émile', 'Antoine', 'Olivier',
        'Mathis', 'Hudson', 'Lincoln', 'Wyatt', 'Connor', 'Ryan', 'Dylan', 'Tyler', 'Brandon', 'Kyle', 'Cody',
        'Wayne', 'Marc', 'Étienne', 'Alexis', 'Justin', 'Kevin', 'Patrick', 'Simon', 'Isaac', 'Henry',
      ],
      last: [
        'Tremblay', 'Gagnon', 'Roy', 'Côté', 'Bouchard', 'Gauthier', 'Morin', 'Lavoie', 'Fortin', 'Gagné', 'Smith',
        'Brown', 'Wilson', 'MacDonald', 'Campbell', 'Anderson', 'Taylor', 'Thompson', 'Lee', 'White', 'Singh',
        'Leblanc', 'Bélanger', 'Ouellet', 'Chen',
      ],
    },
  },
  {
    id: 'mx',
    name: 'Mexico',
    nameTr: 'Meksika',
    cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Cancún', 'Oaxaca', 'Mérida', 'Tijuana', 'Veracruz', 'Acapulco'],
    wageFactor: 0.35,
    costOfLiving: 6000,
    mortalityShift: 0.01,
    currency: { code: 'MXN', locale: 'es-MX', rate: 18 },
    names: {
      female: [
        'Sofía', 'Valentina', 'Regina', 'Camila', 'Ximena', 'Renata', 'Fernanda', 'Daniela', 'Mariana', 'Victoria',
        'Isabella', 'Valeria', 'Natalia', 'Andrea', 'Paola', 'Guadalupe', 'Alejandra', 'Gabriela', 'Lucía', 'Emilia',
        'Romina', 'Itzel', 'Montserrat', 'Jimena', 'Ana', 'Elena', 'Carmen', 'Rosa', 'Patricia', 'Verónica',
        'Adriana', 'Claudia', 'Mónica', 'Brenda', 'Karla', 'Diana', 'Fátima', 'Abril', 'Luciana', 'Paulina',
        'Esmeralda', 'Yolanda', 'Leticia', 'Araceli', 'Marisol', 'Aurora',
      ],
      male: [
        'Santiago', 'Mateo', 'Sebastián', 'Leonardo', 'Matías', 'Emiliano', 'Diego', 'Daniel', 'Miguel', 'Alejandro',
        'José', 'Juan', 'Luis', 'Carlos', 'Jorge', 'Jesús', 'Fernando', 'Ricardo', 'Eduardo', 'Javier', 'Francisco',
        'Antonio', 'Manuel', 'Rodrigo', 'Gael', 'Iker', 'Emilio', 'Andrés', 'Joaquín', 'Rafael', 'Pablo', 'Héctor',
        'Arturo', 'Raúl', 'Alberto', 'Roberto', 'Óscar', 'Ángel', 'Iván', 'Gustavo', 'Ernesto', 'Ramón', 'Armando',
        'Enrique', 'Tadeo', 'Maximiliano',
      ],
      last: [
        'Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz',
        'Flores', 'Gómez', 'Morales', 'Vázquez', 'Reyes', 'Jiménez', 'Torres', 'Díaz', 'Gutiérrez', 'Ruiz', 'Mendoza',
        'Aguilar', 'Ortiz', 'Moreno', 'Castillo', 'Romero',
      ],
    },
  },
  {
    id: 'jp',
    name: 'Japan',
    nameTr: 'Japonya',
    cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Sapporo', 'Fukuoka', 'Nagoya', 'Kobe', 'Sendai', 'Hiroshima', 'Nagasaki'],
    wageFactor: 0.75,
    costOfLiving: 13000,
    mortalityShift: -0.04,
    currency: { code: 'JPY', locale: 'ja-JP', rate: 150 },
    names: {
      female: [
        'Yui', 'Hina', 'Sakura', 'Yuna', 'Aoi', 'Rin', 'Mio', 'Himari', 'Riko', 'Saki', 'Haruka', 'Nanami', 'Misaki',
        'Yuka', 'Ayaka', 'Yoko', 'Keiko', 'Naoko', 'Tomoko', 'Akiko', 'Emi', 'Kana', 'Momoka', 'Kokona', 'Tsumugi',
        'Ema', 'Akari', 'Hana', 'Yuzuki', 'Koharu', 'Mitsuki', 'Asuka', 'Chihiro', 'Nozomi', 'Megumi', 'Kaori', 'Miyu',
        'Rina', 'Erika', 'Mayu', 'Natsuki', 'Sayaka', 'Shiori', 'Fumiko', 'Hinako', 'Noa',
      ],
      male: [
        'Haruto', 'Sota', 'Ren', 'Yuto', 'Minato', 'Riku', 'Hinata', 'Itsuki', 'Yuki', 'Hiroshi', 'Takashi', 'Kenji',
        'Kenta', 'Daiki', 'Shota', 'Kaito', 'Sora', 'Hayato', 'Yamato', 'Takumi', 'Ryota', 'Kazuki', 'Yusuke',
        'Daisuke', 'Shun', 'Taiga', 'Yuma', 'Kosuke', 'Takeshi', 'Satoshi', 'Akira', 'Makoto', 'Naoki', 'Ryo',
        'Tatsuya', 'Kenichi', 'Masato', 'Tomoya', 'Haruki', 'Sho', 'Ichiro', 'Jiro', 'Osamu', 'Isamu', 'Hideo', 'Kazuo',
      ],
      last: [
        'Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato',
        'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Mori',
        'Abe', 'Ikeda', 'Hashimoto', 'Ishikawa', 'Ogawa',
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

/** Country ids in the order of COUNTRIES. */
export type CountryId = 'us' | 'uk' | 'de' | 'tr' | 'br' | 'fr' | 'es' | 'it' | 'nl' | 'ca' | 'mx' | 'jp';

/**
 * The country as it is said in a sentence, without suffixes: "the Netherlands", "the US" / "Hollanda", "Amerika".
 * Turkish uses the everyday names (Amerika, İngiltere) so the suffix helpers work: Amerika'ya, İngiltere'de.
 */
export function countryShort(id: string, lang: 'en' | 'tr' | undefined): string {
  if (lang === 'tr') return id === 'us' ? 'Amerika' : id === 'uk' ? 'İngiltere' : getCountry(id).nameTr;
  return id === 'us' ? 'the US' : id === 'uk' ? 'the UK' : id === 'nl' ? 'the Netherlands' : getCountry(id).name;
}

/**
 * First names for a baby in a family that came from another country (round 6: a Turkish family in Germany names its
 * children Elif and Can, sometimes Lena or Leon). `roots` is the family's home country, or undefined for a local family.
 * Names from the home country come first; the local names follow, so a plain pick from the list leans to the roots
 * while a family that has settled for good uses the local list. Pure, no RNG.
 */
export function familyNamePool(countryId: string, roots: string | undefined, gender: Gender): string[] {
  if (!roots || roots === countryId) return firstNames(countryId, gender);
  const home = firstNames(roots, gender);
  const local = firstNames(countryId, gender).filter((n) => !home.includes(n));
  // two in three from home, one in three local
  return [...home, ...local.slice(0, Math.ceil(home.length / 2))];
}
