const express = require('express');
const router = express.Router();
const passport = require('passport');
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');
const axios = require('axios');
const session = require('express-session');

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

//GET za cijelu kolekciju podataka
router.get('/api/games', async (req, res) => {
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
    const transformedData = jsonData.map((game) => {
      return {
        "@context": {
          "ime_igre": "https://schema.org/name",
          "datum_izdanja": "https://schema.org/datePublished",
          "ocjena": "https://schema.org/price"
        },
        "@type": "Game",
        zanr: game.game_data.zanr,
        cijena: game.game_data.cijena,
        ocjena: game.game_data.ocjena,
        fransiza: game.game_data.fransiza,
        ime_igre: game.game_data.ime_igre,
        developeri: game.game_data.developeri,
        ime_izdavac: game.game_data.ime_izdavac,
        multiplayer: game.game_data.multiplayer,
        singleplayer: game.game_data.singleplayer,
        datum_izdanja: game.game_data.datum_izdanja,
        predvidjeni_br_sati_za_igranje: game.game_data.predvidjeni_br_sati_za_igranje
      };
    });
    if (jsonData.length === 0) {
      const response = {
        status: 'OK',
        message: 'No game objects found',
        response: null,
      };
      res.status(200).json(response);
    } else {
      const response = {
        status: 'OK',
        message: 'Fetched game objects',
        response: transformedData
      };

      res.status(200).json(response);
    }
  } catch (error) {
    console.error('Error retrieving data:', error);
    const errorResponse = {
      status: 'Error',
      message: 'Internal Server Error',
      response: null,
    };
    res.status(500).json(errorResponse);
  }
});


//dobavi podatke o jednoj igri sa imenom
router.get('/api/game/:ime_igre', async (req, res) => {
  try {
    const { ime_igre } = req.params;

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
    WHERE igra.ime = $1
    GROUP BY igra.ime, igra.ime_izdavac, igra.datum_izdanja, igra.cijena, igra.zanr, igra.predvidjeni_br_sati_za_igranje, igra.fransiza, igra.ocjena, igra.singleplayer, igra.multiplayer
    `;
    const result = await pool.query(query,[ime_igre]);
    const jsonData = result.rows;

    if (jsonData.length === 0) {
      const response = {
        status: 'Not Found',
        message: 'No game found with name'+ime_igre,
        response: null,
      };
      res.status(404).json(response);
    } else {
      const response = {
        status: 'OK',
        message: 'Fetched game',
        response : {
              game_data: {
                "@context": {
                  "ime_igre": "https://schema.org/name",
                  "datum_izdanja": "https://schema.org/datePublished",
                  "cijena": "https://schema.org/price"
                },
                "@type": "Game",
                zanr: jsonData[0].game_data.zanr,
                cijena: jsonData[0].game_data.cijena,
                ocjena: jsonData[0].game_data.ocjena,
                fransiza: jsonData[0].game_data.fransiza,
                ime_igre: jsonData[0].game_data.ime_igre,
                developeri: jsonData[0].game_data.developeri,
                ime_izdavac: jsonData[0].game_data.ime_izdavac,
                multiplayer: jsonData[0].game_data.multiplayer,
                singleplayer: jsonData[0].game_data.singleplayer,
                datum_izdanja: jsonData[0].game_data.datum_izdanja,
                predvidjeni_br_sati_za_igranje: jsonData[0].game_data.predvidjeni_br_sati_za_igranje
              }
            }
          
      };

      res.status(200).json(response);
    }
  } catch (error) {
    console.error('Error retrieving data:', error);
    const errorResponse = {
      status: 'Error',
      message: 'Internal Server Error',
      response: null,
    };
    res.status(500).json(errorResponse);
  }
});

//delete jednog podatka na kolekciji
router.delete('/api/game/:ime_igre', async (req, res) => {
  try {
    const { ime_igre } = req.params;

    const checkQuery = 'SELECT COUNT(*) FROM igra WHERE ime = $1';
    const checkResult = await pool.query(checkQuery, [ime_igre]);

    if (checkResult.rows[0].count === '0') {
      const response = {
        status: 'Not found',
        message: `No game found with name ${ime_igre}`,
        response: null,
      };
      res.status(404).json(response);
    } else {
      const deleteQuery1 = 'DELETE FROM developer_igra WHERE ime_igra = $1';
      await pool.query(deleteQuery1, [ime_igre]);
      const deleteQuery = 'DELETE FROM igra WHERE ime = $1';
      await pool.query(deleteQuery, [ime_igre]);
      

      const successResponse = {
        status: 'OK',
        message: `Deleted game with name ${ime_igre}`,
        response: null,
      };
      res.status(200).json(successResponse);
    }
  } catch (error) {
    console.error('Error deleting data:', error);
    const errorResponse = {
      status: 'Error',
      message: 'Internal Server Error',
      response: null,
    };
    res.status(500).json(errorResponse);
  }
});

//put za promijenit cijenu igre
router.put('/api/game/:ime_igre', async (req, res) => {
  try {
    const { ime_igre } = req.params;
    const { nova_cijena } = req.body;


  const checkQuery = 'SELECT COUNT(*) FROM igra WHERE ime = $1';
    const checkResult = await pool.query(checkQuery, [ime_igre]);
    if (isNaN(parseFloat(nova_cijena))) {
      console.error('Error updating data:', error);
      const errorResponse = {
        status: 'Error',
        message: 'Price should be a number',
        response: null,
      };
      res.status(400).json(errorResponse);
    }
    else if (checkResult.rows[0].count === '0') {
      const response = {
        status: 'Not found',
        message: `No game found with name ${ime_igre}`,
        response: null,
      };
      res.status(404).json(response);
    } else {
      const updateQuery = 'UPDATE igra SET cijena = $2 WHERE ime = $1';
      await pool.query(updateQuery, [ime_igre,nova_cijena]);
      const successResponse = {
        status: 'OK',
        message: `Updated game price name ${ime_igre} to new price : ${nova_cijena}`,
        response: null,
      };
      res.status(200).json(successResponse);
    }
  } catch (error) {
    console.error('Error updating data:', error);
    const errorResponse = {
      status: 'Error',
      message: 'Internal Server Error',
      response: null,
    };
    res.status(500).json(errorResponse);
  }
});

//post za dodati igru
router.post('/api/game', async (req, res) => {
  try {
    const gameData = req.body;
    let checkQuery = `SELECT COUNT(*) FROM igra WHERE ime = $1`;
    const checkResult1 = await pool.query(checkQuery, [gameData.ime]);
    checkQuery = `SELECT COUNT(*) FROM developer WHERE  developer.ime_developera = $1`;
    const checkResult2 = await pool.query(checkQuery, [gameData.developeri]);

    
    if (checkResult1.rows[0].count !== '0') {
      const errorResponse = {
        status: 'Error',
        message: 'Game already exists',
        response: null,
      };
      res.status(400).json(errorResponse);
      return;
    } 
    else if (checkResult2.rows[0].count === '0') {
      const errorResponse = {
        status: 'Error',
        message: 'Game developer is not in database',
        response: null,
      };
      res.status(400).json(errorResponse);
      return;
    }
    
    const insertQuery = 'INSERT INTO igra (ime, ime_izdavac, datum_izdanja, cijena, zanr, predvidjeni_br_sati_za_igranje, fransiza, ocjena, singleplayer, multiplayer) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
    await pool.query(insertQuery, [
      gameData.ime,
      gameData.ime_izdavac,
      gameData.datum_izdanja,
      gameData.cijena,
      gameData.zanr,
      gameData.predvidjeni_br_sati_za_igranje,
      gameData.fransiza,
      gameData.ocjena,
      gameData.singleplayer,
      gameData.multiplayer
  ]);
    const insertQuery1 = 'INSERT INTO developer_igra  (ime_igra, developer) VALUES ($1,$2)';
    await pool.query(insertQuery1, [gameData.ime,gameData.developeri]);

    res.status(201).json({ message: 'Game added successfully', data: gameData });
  } catch (error) {
    console.error('Error updating data:', error);
    const errorResponse = {
      status: 'Error',
      message: 'Internal Server Error',
      response: null,
    };
    res.status(500).json(errorResponse);
  }
});

//GET za developera
router.get('/api/developer/:ime_developera', async (req, res) => {
  try {
    const { ime_developera } = req.params;

    const query = `
      SELECT
        jsonb_build_object(
          'ime_developera', developer.ime_developera,
          'godina_osnutka', developer.godina_osnutka
        ) AS developer_data
      FROM developer
      WHERE developer.ime_developera = $1
    `;

    const result = await pool.query(query, [ime_developera]);
    const jsonData = result.rows;

    if (jsonData.length === 0) {
      const response = {
        status: 'Not Found',
        message: `No developer found with name ${ime_developera}`,
        response: null,
      };
      res.status(404).json(response);
    } else {
      const response = {
        status: 'OK',
        message: 'Fetched developer',
        response: jsonData,
      };
      res.status(200).json(response);
    }
  } catch (error) {
    console.error('Error retrieving developer data:', error);
    const errorResponse = {
      status: 'Error',
      message: 'Internal Server Error',
      response: null,
    };
    res.status(500).json(errorResponse);
  }
});

//GET za free igre
router.get('/api/freegames', async (req, res) => {
  try {
    const query = `
      SELECT
        jsonb_build_object(
          'ime_igre', igra.ime,
          'cijena', igra.cijena
        ) AS game_data
      FROM igra
      WHERE igra.cijena = 0
    `;

    const result = await pool.query(query);
    const jsonData = result.rows;
    const transformedData = jsonData.map((game) => {
      return {
        "@context": {
          "ime_igre": "https://schema.org/name",
          "cijena": "https://schema.org/price"
        },
        "@type": "Game",
        zanr: game.game_data.zanr,
        cijena: game.game_data.cijena,
        ocjena: game.game_data.ocjena,
        fransiza: game.game_data.fransiza,
        ime_igre: game.game_data.ime_igre,
        developeri: game.game_data.developeri,
        ime_izdavac: game.game_data.ime_izdavac,
        multiplayer: game.game_data.multiplayer,
        singleplayer: game.game_data.singleplayer,
        datum_izdanja: game.game_data.datum_izdanja,
        predvidjeni_br_sati_za_igranje: game.game_data.predvidjeni_br_sati_za_igranje
      };
    });
    if (jsonData.length === 0) {
      const response = {
        status: 'OK',
        message: 'No free games found',
        response: null,
      };
      res.status(200).json(response);
    } else {
      const response = {
        status: 'OK',
        message: 'Fetched free games',
        response: transformedData,
      };
      res.status(200).json(response);
    }
  } catch (error) {
    console.error('Error retrieving free games data:', error);
    const errorResponse = {
      status: 'Error',
      message: 'Internal Server Error',
      response: null,
    };
    res.status(500).json(errorResponse);
  }
});

//GET za price range
router.get('/api/pricerange/:minPrice/:maxPrice', async (req, res) => {
  try {
    const { minPrice, maxPrice } = req.params;

    const query = `
      SELECT
        jsonb_build_object(
          'ime_igre', igra.ime,
          'cijena', igra.cijena
        ) AS game_data
      FROM igra
      WHERE igra.cijena BETWEEN $1 AND $2
    `;

    const result = await pool.query(query, [minPrice, maxPrice]);
    const jsonData = result.rows;

    if (jsonData.length === 0) {
      const response = {
        status: 'OK',
        message: 'No games found within the specified price range',
        response: null,
      };
      res.status(200).json(response);
    } else {
      const response = {
        status: 'OK',
        message: 'Fetched games within the specified price range',
        response: jsonData,
      };
      res.status(200).json(response);
    }
  } catch (error) {
    console.error('Error retrieving games within price range data:', error);
    const errorResponse = {
      status: 'Error',
      message: 'Internal Server Error',
      response: null,
    };
    res.status(500).json(errorResponse);
  }
});
router.get('/openapi', (req, res) => {
  const openapiPath = path.join(__dirname, '../../docs/openapi.yaml');

  res.setHeader('Content-Type', 'application/x-yaml');

  try {
    res.sendFile(openapiPath);
  } catch (error) {
    console.error('Error sending OpenAPI file:', error);
    res.status(500).send('Internal Server Error');
  }
});


function convertToCsv(jsonData) {
  const header = Object.keys(jsonData[0]).join(',') + '\n';
  const rows = jsonData.map(obj => Object.values(obj).join(',') + '\n');
  return header + rows.join('');
}



module.exports = router;

