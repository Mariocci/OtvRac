const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'otvRac',
    password: 'bazepodataka',
    port: 5434,
});

router.use(express.static(path.join(__dirname, '../public')));

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

router.get('/create-files', async (req, res) => {
  try {
    const query = `
    SELECT
    jsonb_build_object(
        'ime_igre', igra.ime,
        'ime_izdavac', igra.ime_izdavac,
        'developeri', jsonb_agg(jsonb_build_object('developer', developer_igra.developer, 'godina_osnutka', developer.godina_osnutka)),
        'datum_izdanja', igra.datum_izdanja,
        'cijena', igra.cijena,
        'zanr', igra.zanr,
        'predvidjeni_br_sati_za_igranje', igra.predvidjeni_br_sati_za_igranje,
        'fransiza', igra.fransiza,
        'ocjena', igra.ocjena,
        'singleplayer', igra.singleplayer,
        'multiplayer', igra.multiplayer
    ) AS game_data
    FROM igra
    LEFT JOIN developer_igra ON igra.ime = developer_igra.ime_igra
    LEFT JOIN developer ON developer_igra.developer = developer.ime_developera
    GROUP BY igra.ime, igra.ime_izdavac, igra.datum_izdanja, igra.cijena, igra.zanr, igra.predvidjeni_br_sati_za_igranje, igra.fransiza, igra.ocjena, igra.singleplayer, igra.multiplayer
    `;

    const result = await pool.query(query);
    const jsonData = result.rows;

    
    const jsonFilePath = path.join(__dirname, '../../public/data/PC_igre.json');
    await fs.writeFile(jsonFilePath, JSON.stringify(jsonData));

    const queryCSV = `SELECT ime,ime_izdavac,developer,datum_izdanja,cijena,zanr,predvidjeni_br_sati_za_igranje,fransiza,ocjena,singleplayer,multiplayer 
    from igra JOIN developer_igra on igra.ime=developer_igra.ime_igra
    `;
    const queryResult = await pool.query(queryCSV);
    const csvData = queryResult.rows;
  
    const csvContent = csvData.map(row => {
      const values = [
        row.ime,
        row.ime_izdavac,
        row.developer,
        row.datum_izdanja,
        row.cijena,
        row.zanr,
        row.predvidjeni_br_sati_za_igranje,
        row.fransiza,
        row.ocjena,
        row.singleplayer,
        row.multiplayer,
      ];
  
      return values.map(value => (value !== null ? value : '')).join(',');
    }).join('\n');
  

    const csvFilePath = path.join(__dirname, '../../public/data/PC_igre.csv');

    await fs.writeFile(csvFilePath, csvContent);

    res.send('Files created successfully.');
  } catch (error) {
    console.error('Error creating files:', error);
    res.status(500).send('Internal Server Error');
  }
});

function convertToCsv(jsonData) {
  const header = Object.keys(jsonData[0]).join(',') + '\n';
  const rows = jsonData.map(obj => Object.values(obj).join(',') + '\n');
  return header + rows.join('');
}

module.exports = router;
