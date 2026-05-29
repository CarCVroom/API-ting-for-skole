const omraader = document.getElementById('omraader');
const omrTypeHTML = document.getElementById('omrType');

omrTypeHTML.addEventListener('change', () => {
        if (omrTypeHTML.value === 'NO') {
                omraader.value = '0';
                omraader.disabled = true;
        } else {
                omraader.disabled = false;
        }
});

omraader.addEventListener('change', () => {
        if (omrTypeHTML.value === 'NO') {
                omrTypeHTML.value = '';
                omraader.disabled = true;
        } else {
                omraader.disabled = false;
        }
});

if (omrTypeHTML.value === 'NO') {
        omraader.value = '';
        omraader.disabled = true;
}

const slide = document.getElementById('slide'); 

noUiSlider.create(slide, {
        start: [1995, 2026],
        connect: true,
        range: { min: 1995, max: 2026 },
        step: 1,
        tooltips: [true, true],  // keep this
        format: {
                to: v => Math.round(v),
                from: v => Number(v)
        }
});

slide.noUiSlider.on('update', (values) => {
        document.getElementById('from-label').textContent = `Fra: ${values[0]}`;
        document.getElementById('to-label').textContent = `Til: ${values[1]}`;
});

function borderRed() {
        const overlay = document.createElement("div");
        overlay.style.cssText = `
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 9999;
                animation: pulse 1s infinite;
        `;

        const style = document.createElement("style");
        style.textContent = `
                @keyframes pulse {
                        0%   { box-shadow: inset 0 0 0px red; }
                        50%  { box-shadow: inset 0 0 40px red; }
                        100% { box-shadow: inset 0 0 0px red; }
                }
        `;

        document.head.appendChild(style);
        document.body.appendChild(overlay);

        const text = document.createElement('h1');

        text.style.color = "red";
        text.textContent = "Det er ikke noe Data";

        document.body.append(text)

        setTimeout(() => {
                overlay.remove();
                text.remove();
        }, 5000); // 3 seconds
}

async function getData() {
        let omraade = omraader.value;
        omraade = parseInt(omraade);
        let omrType = omrTypeHTML.value;
        let [minYear, maxYear] = slide.noUiSlider.get();
        minYear = String(minYear);
        maxYear = String(maxYear);
        let fylling_TWh, kapasitet_TWh, fyllingsgrad;

        let res = await fetch('https://biapi.nve.no/magasinstatistikk/api/Magasinstatistikk/HentOffentligData');
        let data = await res.json();
        
        if (omraade) {
                data = data.filter(el => el.omrnr === omraade); // Sorter ut alle andre data
        }

        data.sort((a, b) => new Date(a.dato_Id) - new Date(b.dato_Id)); // Sorter med dato

        if (omrType) {
                data = data.filter(el => el.omrType === omrType);
        }

        data = data.filter(el => new Date(el.dato_Id) >= new Date(minYear)); // Sorter med alle aarene 
        data = data.filter(el => new Date(el.dato_Id) <= new Date(`${maxYear}-12-31`)); 


        data = data.map(({ iso_aar, iso_uke, neste_Publiseringsdato, ...rest}) => rest); // Sletter data som ikke trengs

        if (data.length === 0) {
                borderRed();
                return;
        }

        const labels = data.map(el => el.dato_Id);
        const values = data.map(el => el.fylling_TWh);

        const colors = {
                1: "red",
                2: "blue",
                3: "green",
                4: "orange",
                5: "purple"
        };

        const regions = [1,2,3,4,5];

        const datasets = regions.map(omrnr => {
                const regionData = data.filter(el => el.omrnr === omrnr);
                return {
                        label: `Området ${omrnr}`,
                        data: regionData.map(el => ({ x: el.dato_Id, y: el.fylling_TWh })),
                        borderColor: colors[omrnr],
                        fill: true
                };
        });

        new Chart(document.getElementById("grafOmEnergi"), { 
                type: 'line',
                data: { datasets },
                options: { 
                        responsive: true ,
                        scales: {
                                x: { type: 'time' }
                        }
                }
        });

        console.log(data) // The chestnut man netflix
}