
/*
document.addEventListener("DOMContentLoaded", function () {
  fetch('/create-files')
    .catch(error => console.error('Error:', error));

  fetch('../data/PC_igre.json')  
    .then(response => response.json()) 
    .then(data => {
      console.log('Data:', data);
      initializeDataTable(data);
    })
    .catch(error => console.error('Error:', error));
    
  })
function initializeDataTable(data) {
  $('#myTable').DataTable({
    data: data,
    columns: [
      { data: 'game_data.ime_igre', title: 'Game Title' },
      { data: 'game_data.ime_izdavac', title: 'Publisher' },
      {
        data: 'game_data.developeri',
        title: 'Developers',
        render: function (data) {
          return data ? data.map((dev) => dev.developer).join(', ') : 'N/A';
        },
      },
      { data: 'game_data.datum_izdanja', title: 'Release Date' },
      { data: 'game_data.cijena', title: 'Price' },
      { data: 'game_data.zanr', title: 'Genre' },
      {
        data: 'game_data.predvidjeni_br_sati_za_igranje',
        title: 'Estimated Playtime (hours)',
        render: function (data) {
          return data !== null ? data + ' hours' : '-';
        },
      },
      { data: 'game_data.fransiza', title: 'Franchise', render: function (data) {
        return data || '-';
      }},
      { data: 'game_data.ocjena', title: 'Rating', render: function (data) {
        return data !== null ? data : '-';
      }},
      { data: 'game_data.singleplayer', title: 'Singleplayer', render: function (data) {
        return data !== null ? (data ? 'Yes' : 'No') : 'No';
      }},
      { data: 'game_data.multiplayer', title: 'Multiplayer', render: function (data) {
        return data !== null ? (data ? 'Yes' : 'No') : 'No';
      }},
    ],
  });
}*/


