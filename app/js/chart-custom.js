// chart index 
const data1 = {
    labels: [
        'Marketing',
        'Bussiness Development',
        'Product Development',
        'Reserve',
        'Reserve',
        'Token Sale'
    ],
    datasets: [{
        label: 'My First Dataset',
        data: [25, 25, 10 , 10 , 10 , 20],
        backgroundColor: [
        '#3D88FB',
        '#5637C8',
        '#00D199',
        '#C87B07',
        '#A92535',
        '#9116CD'
        ], 
    }]
};

const config1 = {
    type: 'doughnut',
    data: data1,
    width:240,
    options: {
        maintainAspectRatio: false,
        plugins: {
            legend: false // Hide legend
        },
        scales: {
            y: {
                display: false // Hide Y axis labels
            },
            x: {
                display: false // Hide X axis labels
            }
        }   
    }
};

    const myChart1 = new Chart(
    document.getElementById('myChart1'),
    config1
    );
    const myChart2 = new Chart(
    document.getElementById('myChart2'),
    config1
);

// chart home defi 1

const data3 = {
    labels: [
        'Reserve Fund',
        'Team & Advisor',
        'Presale Token',
        'Bounty Program',
        'Bounty Program',
    ],
    datasets: [{
        label: 'My First Dataset',
        data: [40, 30, 10 , 10 , 10 ],
        backgroundColor: [
        '#1998CA',
        '#343EBF',
        '#A00763',
        '#DEAD2F',
        '#1CA151'
        ], 
    }]
};

const config3 = {
    type: 'doughnut',
    data: data3,
    width: 280,
    options: {
        maintainAspectRatio: false,
        plugins: {
            legend: false // Hide legend
        },
        scales: {
            y: {
                display: false // Hide Y axis labels
            },
            x: {
                display: false // Hide X axis labels
            }
        }   
        }
};

const myChartv3 = new Chart(
document.getElementById('myChart3'),
config3
);


const data4 = {
    labels: [
        'Product Development',
        'Marketing',
        'Business Development',
        'Legal & Regulation',
        'Operational',
    ],
    datasets: [{
        label: 'My First Dataset',
        data: [40, 30, 10 , 10 , 10 ],
        backgroundColor: [
        '#1998CA',
        '#343EBF',
        '#A00763',
        '#DEAD2F',
        '#1CA151'
        ], 
    }]
};

    const config4 = {
    type: 'doughnut',
    data: data4,
    width: 280,
    options: {
        maintainAspectRatio: false,
        plugins: {
            legend: false // Hide legend
        },
        scales: {
            y: {
                display: false // Hide Y axis labels
            },
            x: {
                display: false // Hide X axis labels
            }
        }   
        }
    };

    const myChartv4 = new Chart(
    document.getElementById('myChart4'),
    config4
    );