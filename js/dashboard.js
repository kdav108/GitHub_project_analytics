let devPage = 0
let maxPage = 1

$(function () {
    $("#datepickerstart").datepicker({ maxDate: 0 }).on("change", updateDate)
    $("#datepickerend").datepicker({ maxDate: 0 }).on("change", updateDate)

    document.querySelector('#datepickerstart tr:first-child td[data-year="2019"]').click()
});

async function updateDate() {
    // startDate = (new Date((new Date()).setDate((new Date(document.getElementById('datepickerstart').value).getDate() + 1)))).toISOString()
    const startDate = (new Date(document.getElementById('datepickerstart').value)).toISOString()
    const endDate = (new Date(document.getElementById('datepickerend').value)).toISOString()
    // const endDate = new Date((new Date()).setDate((new Date(document.getElementById('datepickerend').value)).getDate() + 1)).toISOString()

    // Reset global variables
    allIssues = []
    all_issues = null
    all_developers = []
    number_of_total_open_issues = null
    sorted_name = true
    sorted_open_issues = false
    sorted_closed_issues = false

    document.getElementById('lineChart').remove()
    newCanvas = document.createElement('canvas')
    newCanvas.width = 400
    newCanvas.height = 200
    newCanvas.id = 'lineChart'
    document.getElementById('burndown_chart').appendChild(newCanvas)

    document.getElementById('devNameIssuesCountTable').innerHTML = ''

    const queryParams = new URLSearchParams(new URL(document.URL).search)
    const repoURL = queryParams.get('repoURL')

    if (!repoURL) {
        document.querySelector('#output .errors').innerHTML += '<h3>Please input a Repo URL above.</h3>'
        document.querySelector('#output .errors').classList.remove('hidden')
        return
    }

    const splitStart = (new Date(startDate)).toString().split(' ', 4)
    const splitEnd = (new Date(endDate)).toString().split(' ', 4)
    const startText = splitStart[1] + ' ' + splitStart[2] + ', ' + splitStart[3]
    const endText = splitEnd[1] + ' ' + splitEnd[2] + ', ' + splitEnd[3]

    document.getElementById('daterange').innerText = startText + ' - ' + endText

    const splitURL = repoURL.split('github.com/', 2)[1].split('/', 2)
    const owner = splitURL[0]
    const name = splitURL[1]

    document.getElementsByClassName('repoTitle')[0].innerText = owner + '/' + name

    // Construct and display output
    let issues = []
    let page = ''
    let iterations = 0
    while (issues.length < 100 && page !== null && iterations < 10) {
        data = await dateCall(owner, name, startDate, endDate, page).then(data => data.json())

        for (i = 0; i < data.data.repository.issues.edges.length; i++) {
            const issue = data.data.repository.issues.edges[i]
            if (Date.parse(issue.node.createdAt) < Date.parse(startDate)) { continue }
            if (Date.parse(issue.node.createdAt) > Date.parse(endDate)) { continue }
            // if (Date.parse(issue.node.createdAt) > Date.parse(nextDate)) { continue }
            if (issue.node.closedAt === null) { issues.push(issue); continue; }
            if (Date.parse(issue.node.closedAt) < Date.parse(endDate)) { continue }
            issues.push(issue)
        }

        if (!data.data.repository.issues.pageInfo.hasPreviousPage) {
            page = null
            break
        }
        page = ' before:"' + data.data.repository.issues.pageInfo.startCursor + '"'
        // console.log(issues)

        iterations++
    }
    if (issues.length > 100) {
        issues = issues.slice(0, 100)
    }
    console.log('Final Issues', issues)
    issues.forEach(issue => { console.log(issue.node.createdAt.split('T', 1)[0]) })
    initialiseIssues(issues)
}

function dateCall(owner, name, startDate, endDate, page) {
    const query = `
        query {
            repository(owner:"${owner}", name:"${name}") {
                issues(last:100${page}, filterBy: {
                    since: "${startDate}"
                }) {
                    totalCount
                    pageInfo {
                        endCursor
                        hasNextPage
                        hasPreviousPage
                        startCursor
                    }
                    edges {
                        node {
                            title
                            url
                            closedAt
                            createdAt
                            assignees(first: 10) {
                                edges {
                                    node {
                                        name
                                    }
                                }
                            }
                            comments(last:100) {
                                totalCount
                            }
                        }
                    }
                }
            }
        }
    `

    return fetch(endpoint, {
        method: 'post',
        headers: {
            "Authorization": "bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
    })
}

function burnDownNew() {
    const dates = []
    all_issues.forEach(issue => {
        date = date_format_change(issue.creationTime.split('T', 1)[0])
        if (!dates.includes(date)) {
            dates.push(date)
        }
    })
    dates.sort((a, b) => {
        return new Date(a) - new Date(b)
    })
    console.log(dates)

    const data = Array(dates.length).fill(0)
    all_issues.forEach(issue => {
        date = date_format_change(issue.creationTime.split('T', 1)[0])
        dateIndex = dates.indexOf(date)
        data[dateIndex]++

        for (i = dateIndex + 1; i < dates.length; i++) {
            if (issue.closedTime === null) {
                data[i]++
                continue
            }
            if (new Date(issue.closedTime) > new Date(dates[i])) {
                data[i]++
                continue
            }
        }
    })
    console.log(data)

    if (new Date(dates[0]) < new Date(document.getElementById('datepickerstart').value)) {
        dates.shift()
        data.shift()
    }

    if (new Date(dates[dates.length - 1]) < new Date(document.getElementById('datepickerstart').value)) {
        dates.pop()
        data.pop()
    }

    data.forEach((dataPoint, index) => {
        if (dataPoint > 99) {
            data[index] = 99
        }
    })

    let count = 0
    all_issues.forEach(issue => {
        if (issue.closedTime === null) {
            count++
        }
    })

    data[data.length - 1] = count

    let ctx = document.getElementById('lineChart');
    let lineChart = new Chart(ctx, {
        type: 'line',
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        fontSize: 14
                    }
                }],
                xAxes: [{
                    ticks: {
                        fontSize: 14
                    }
                }]
            }
        },
        data: {
            labels: dates,
            datasets: [
                {
                    fill: false,
                    label: "Number of issues still open",
                    lineTension: 0,
                    backgroundColor: "rgba(222,103,137,0.4)",
                    borderColor: "rgba(222,103,137,1)",
                    borderCapStyle: 'butt',
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: 'miter',
                    pointBorderColor: "rgba(222,103,137,1)",
                    pointBackgroundColor: "#fff",
                    pointBorderWidth: 1,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: "rgba(222,103,137,1)",
                    pointHoverBorderColor: "rgba(220,220,220,1)",
                    pointHoverBorderWidth: 2,
                    pointRadius: 5,
                    pointHitRadius: 10,
                    data: data
                }
            ]
        }
    });
}

function paginateDevs() {
    const rows = [...document.querySelectorAll('#devNameIssuesCountTable tr')]

    const splitRows = rows.reduce((resultArray, item, index) => {
        const chunkIndex = Math.floor(index / 10)
        if (!resultArray[chunkIndex]) { resultArray[chunkIndex] = [] }
        resultArray[chunkIndex].push(item)
        return resultArray
    }, [])

    maxPage = splitRows.length - 1
    if (rows.length < 11) {
        document.getElementById('nextDevButton').disabled = true
    }

    splitRows.forEach((page, index) => {
        page.forEach(row => {
            if (index === devPage) {
                row.classList.remove('hidden')
            } else {
                row.classList.add('hidden')
            }
        })
    })
}

function prevDev() {
    if (devPage > 0) {
        devPage--
        paginateDevs()
        if (devPage === 0) {
            document.getElementById('prevDevButton').disabled = true
        } else {
            document.getElementById('prevDevButton').disabled = false
        }
    }
    if (devPage < maxPage) {
        if (devPage === maxPage) {
            document.getElementById('nextDevButton').disabled = true
        } else {
            document.getElementById('nextDevButton').disabled = false
        }
    }
}

function nextDev() {
    console.log(devPage)
    if (devPage < maxPage) {
        devPage++
        paginateDevs()
        if (devPage === maxPage) {
            document.getElementById('nextDevButton').disabled = true
        } else {
            document.getElementById('nextDevButton').disabled = false
        }
    }
    if (devPage > 0) {
        if (devPage === 0) {
            document.getElementById('prevDevButton').disabled = true
        } else {
            document.getElementById('prevDevButton').disabled = false
        }
    }
}

function resetDevPage() {
    devPage = 0
    document.getElementById('prevDevButton').disabled = true
    if (devPage < maxPage) {
        if (devPage === maxPage) {
            document.getElementById('nextDevButton').disabled = true
        } else {
            document.getElementById('nextDevButton').disabled = false
        }
    }
}