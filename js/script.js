// const token = '12e3d0a97f7385d444f5f6cf28100b71eb41884a'
const token = '19945f1291e0e277945ea1e5256e4ea662ef5d14'
const endpoint = 'https://api.github.com/graphql'
let allIssues = []
let all_issues = null
// Global variables for label that says how many open issues there are currently.
let number_of_total_open_issues = null
// Global variables for the table
let sorted_name = true
let sorted_open_issues = false
let sorted_closed_issues = false

function viewMetrics() {
    const queryParams = new URLSearchParams(new URL(document.URL).search)
    const repoURL = queryParams.get('repoURL')

    if (!repoURL) {
        document.querySelector('#output .errors').innerHTML += '<h3>Please input a Repo URL above.</h3>'
        document.querySelector('#output .errors').classList.remove('hidden')
        return
    }

    const splitURL = repoURL.split('github.com/', 2)[1].split('/', 2)
    const owner = splitURL[0]
    const name = splitURL[1]

    document.getElementsByClassName('repoTitle')[0].innerText = owner + '/' + name

    // Construct and display output
    makeCall(owner, name).then(data => data.json()).then(data => {
        console.log(data.data.repository.issues.edges)
        initialiseIssues(data.data.repository.issues.edges)
    })
}

function initialiseIssues(issues) {
    issues.forEach(issue => {
        const developers = issue.node.assignees.edges.map(developer => developer.node.name)
        allIssues.push(new Issue(issue.node.title, issue.node.bodyText, developers, issue.node.createdAt, issue.node.closedAt, issue.node.comments.totalCount, issue.node.url))
    })
    // Global variable previously was all_issues, which i use in my code so don't delete this.
    all_issues = allIssues
    // Display developer names, number of open and closed issues
    remove_null_dev()
    sort_dev_name()
    display_total_issues_opened_closed()
    // display_burndown_chart()
    burnDownNew()
    display_total_open_issues()
    paginateDevs()
}

function makeCall(owner, name) {
    const query = `
        query {
            repository(owner:"${owner}", name:"${name}") {
                issues(last:100) {
                    totalCount
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
function display_total_open_issues(){
    let count = 0
    all_issues.forEach(issue => {
        if (issue.closedTime === null) {
            count++
        }
    })

    // document.getElementById("label_total_open_issues").innerHTML = number_of_total_open_issues
    document.getElementById("label_total_open_issues").innerHTML = count
    document.querySelector('.dogo').classList.remove('hidden')
}

function issues_open_over_time(list){
    /*
    Purpose: Find the number of issues still open on every single day, starting from first day an issue
             was open, until the last date an issue was created or closed, whichever more current.
    Input: A list containing all issues
    Output: A list of 2-lengthed lists containing the date and the number of issues still open on that date
    */
    let issues_open = [];
    let issues_closed = issues_closed_on_all_days(list);
    let issues_created = issues_created_on_all_days(list);
    let i = 0;
    let j = 0;
    current_date = null;
    if (issues_created.length > 0){
        current_date = issues_created[0][0]
    }
    while (i < issues_closed.length || j < issues_created.length){
        if (j == 0) {
            if (issues_closed.length != 0 && issues_closed[0][0] == issues_created[0][0]) {
                issues_open.push([issues_created[0][0], issues_created[0][1] - issues_closed[0][1]]);
                i += 1;
            }
            else {
                issues_open.push(issues_created[0]);
            }
            j += 1;
        }
        else {
            if (i < issues_closed.length && j < issues_created.length && issues_closed[i][0] == issues_created[j][0]) {
                new_amount = issues_open[j-1][1] + issues_created[j][1] - issues_closed[i][1];
                issues_open.push([current_date, new_amount]);
                i += 1;
            }
            else if (j < issues_created.length){
                new_amount = issues_open[j-1][1] + issues_created[j][1];
                issues_open.push([current_date, new_amount]);
            }
            else if (i < issues_closed.length){
                new_amount = issues_open[j-1][1] + issues_closed[i][1];
                issues_open.push([current_date, new_amount]);
                i += 1
            }
            j += 1;
        }
        current_date = increment_date(current_date)

    }
    return issues_open;
}

function issues_closed_on_all_days(list){
    /*
    Purpose: Find the number of issues closed on every single day
    Input: 
        - A list containing all issues
    Output: A list of 2-lengthed lists containing the date and the number of issues closed on that date
    */
    let issues_closed_list = [];
    let first_close_date = find_first_close_date(list);
    let last_close_date = find_last_close_date(list);
    let current_date = first_close_date;

    while (current_date != last_close_date) {
        issues_closed_list.push([current_date, issues_closed_on_date(list, current_date)]);
        current_date = increment_date(current_date);
    }
    issues_closed_list.push([current_date, issues_closed_on_date(list, current_date)]);

    return issues_closed_list;
}

function issues_created_on_all_days(list){
        /*
    Purpose: Find the number of issues created on every single day
    Input: 
        - A list containing all issues
    Output: A list of 2-lengthed lists containing the date and the number of issues created on that date
    */
    let issues_creation_list = [];
    let first_creation_date = find_first_create_date(list);
    let last_creation_date = find_last_create_date(list);
    let current_date = first_creation_date;

    while (current_date != last_creation_date) {
        issues_creation_list.push([current_date, issues_created_on_date(list, current_date)]);
        current_date = increment_date(current_date);
    }
    issues_creation_list.push([current_date, issues_created_on_date(list, current_date)]);

    return issues_creation_list;
}

function increment_date(date){
            /*
    Purpose: Finds the next day from the given date
    Input: String, a date
    Output: String, the next date
    */
    thirty_months = ["04", "06", "09", "11"];
    thirty_one_months = ["01", "03", "05", "07", "08", "10", "12"];
    if (date.slice(8,10) == "30" && thirty_months.includes(date.slice(5,7))){
        if (date.slice(5,7) == "11") {
            return date.slice(0,4) + "-" + "12-01";
        }
        else if(date.slice(5,7) == "09"){
            return date.slice(0,4) + "-" + "10-01";
        }
        else{
            new_month = parseInt(date.slice(5,7))+1;
            return date.slice(0,4) + "-0" + new_month +"-01";
        }
    }
    else if(date.slice(8,10) == "31" && thirty_one_months.includes(date.slice(5,7))){
        if (date.slice(5,7) == "12") {
            new_year = parseInt(date.slice(0,4))+1;
            return new_year + "-01-01";
        }
        else if(date.slice(5,7) == "10") {
            return date.slice(0,4) + "-" + "11-01";
        }
        else{
            new_month = parseInt(date.slice(5,7))+1
            return date.slice(0,4) + "-0" + new_month +"-01";
        }
    }
    else if(date.slice(8,10) == "29" && date.slice(5,7) == "02" && is_leap_year(parseInt(date.slice(0,4)))){
        return date.slice(0,4) + "-03-01";
    }
    else if(date.slice(8,10) == "28" && date.slice(5,7) == "02"){
        return date.slice(0,4) + "-03-01";
    }
    else{
        new_day = parseInt(date.slice(8,10))+1;
        if (new_day < 10){
            return date.slice(0,7) + "-0" + new_day;
        }
        else{
            return date.slice(0,7) + "-" + new_day;
        }
    }
}

function is_leap_year(year) {
    /*
    Purpose: Determine if the inputted year is a leap year
    Input: Integer, A year
    Output: Boolean, True if it is a leap year
    */
    return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
}

function check_before(year_comparison, month_comparison, day_comparison){
    if (year_comparison < 0){
        return true
    }
    else if (year_comparison == 0){
        if (month_comparison < 0){
            return true
        }
        else if (month_comparison == 0){
            if (day_comparison < 0){
                return true
            }
            else{
                return false
            }
        }
        else{
            return false
        }      
    }
    else{
        return false
    }
}

function check_after(year_comparison, month_comparison, day_comparison){
    if (year_comparison > 0){
        return true
    }
    else if (year_comparison == 0){
        if (month_comparison > 0){
            return true
        }
        else if (month_comparison == 0){
            if (day_comparison > 0){
                return true
            }
            else{
                return false
            }
        }
        else{
            return false
        }      
    }
    else{
        return false
    }
}

function find_first_close_date(list){
    /*
    Purpose: Find the last date in which a issue was closed
    Input: List of instantiations of Issues
    Output: String, a date
    */
    let first_close_date = null;
    for(let i = 0; i < list.length; i++) {
        if(list[i].get_closed_time() != null && first_close_date == null){
            first_close_date = list[i].get_closed_time().slice(0,10);
        }
        else if (list[i].get_closed_time() != null){
            let year_comparison = parseInt(list[i].get_closed_time().slice(0,4)) - parseInt(first_close_date.slice(0,4));
            let month_comparison = parseInt(list[i].get_closed_time().slice(5,7)) - parseInt(first_close_date.slice(5,7));
            let day_comparison = parseInt(list[i].get_closed_time().slice(8,10)) - parseInt(first_close_date.slice(8,10));
            if (check_before(year_comparison, month_comparison, day_comparison)){
                first_close_date = list[i].get_closed_time().slice(0,10);
            }
        }
    }
    return first_close_date;
}

function find_first_create_date(list){
    /*
    Purpose: Find the first date in which a issue was created
    Input: List of instantiations of Issues
    Output: String, a date
    */
    let first_created_date = null;
    for(let i = 0; i < list.length; i++) {
        if (list[i].get_creation_time() != null && first_created_date == null){
            first_created_date = list[i].get_creation_time().slice(0,10);
        }
        else if (list[i].get_creation_time() != null){
            let year_comparison = parseInt(list[i].get_creation_time().slice(0,4)) - parseInt(first_created_date.slice(0,4));
            let month_comparison = parseInt(list[i].get_creation_time().slice(5,7)) - parseInt(first_created_date.slice(5,7));
            let day_comparison = parseInt(list[i].get_creation_time().slice(8,10)) - parseInt(first_created_date.slice(8,10));
            if (check_before(year_comparison, month_comparison, day_comparison)){
                first_created_date = list[i].get_creation_time().slice(0,10);
            }
        }
    }
    return first_created_date;
}


function find_last_close_date(list){
    /*
    Purpose: Find the last date in which a issue was closed
    Input: List of instantiations of Issues
    Output: String, a date
    */
    let last_close_date = null;
    for(let i = 0; i < list.length; i++) {
        if (list[i].get_closed_time() != null && last_close_date == null){
            last_close_date = list[i].get_closed_time().slice(0,10);
        }
        else if (list[i].get_closed_time() != null){
            let year_comparison = parseInt(list[i].get_closed_time().slice(0,4)) - parseInt(last_close_date.slice(0,4));
            let month_comparison = parseInt(list[i].get_closed_time().slice(5,7)) - parseInt(last_close_date.slice(5,7));
            let day_comparison = parseInt(list[i].get_closed_time().slice(8,10)) - parseInt(last_close_date.slice(8,10));
            if (check_after(year_comparison, month_comparison, day_comparison)){
                last_close_date = list[i].get_closed_time().slice(0,10);
            }
        }
    }
    return last_close_date
}

function find_last_create_date(list){
    /*
    Purpose: Find the last date in which a issue was created
    Input: List of instantiations of Issues
    Output: String, a date
    */
    let last_created_date = null;
    for(let i = 0; i < list.length; i++) {
        if (list[i].get_creation_time() != null && last_created_date == null){
            last_created_date = list[i].get_creation_time().slice(0,10);
        }
        else if (list[i].get_creation_time() != null){
            let year_comparison = parseInt(list[i].get_creation_time().slice(0,4)) - parseInt(last_created_date.slice(0,4));
            let month_comparison = parseInt(list[i].get_creation_time().slice(5,7)) - parseInt(last_created_date.slice(5,7));
            let day_comparison = parseInt(list[i].get_creation_time().slice(8,10)) - parseInt(last_created_date.slice(8,10));
            if (check_after(year_comparison, month_comparison, day_comparison)){
                last_created_date = list[i].get_creation_time().slice(0,10);
            }
        }
    }
    return last_created_date
}

function issues_closed_on_date(list, date){
    /*
    Purpose: Find the number of issues closed on a particular date
    Input: 
        - A list containing all issues
        - A date in the format Year-month-day (Example: 2019-09-12)
    Output: Integer, representing the number the issues closed on that date
    */
   let issues_closed = 0;
   for(let i = 0; i < list.length; i++) {
       if (list[i].get_closed_time() != null && list[i].get_closed_time().slice(0,10) == date){
           issues_closed += 1
       }
   }
   return issues_closed
}

function issues_created_on_date(list, date){
    /*
    Purpose: Find the number of issues newly created on a particular date
    Input: 
        - A list containing all issues
        - A date in the format Year-month-day (Example: 2019-09-12)
    Output: Integer, representing the number the issues opened on that date
    */
   let issues_created = 0;
   for(let i = 0; i < list.length; i++) {
       if (list[i].get_creation_time().slice(0,10) == date){
           issues_created += 1
       }
   }
   return issues_created
}

function extend_burndown_to_current_date(burndown_data){
    /*
    Purpose: Extends the data for the burndown chart so it shows until the date it currently is
    Input: None
    Output: None
    */
    new_data = burndown_data
    let today = new Date();
    let current_date = null
    if (today.getMonth() < 9){
        if (today.getDate() <= 9){
            current_date = today.getFullYear()+'-0'+(today.getMonth()+1)+'-0'+today.getDate()
        }
        else{
        current_date = today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+today.getDate()
        }
    }
    else{
        if (today.getDate() <= 9){
            current_date = today.getFullYear()+'-'+(today.getMonth()+1)+'-0'+today.getDate()
        }
        else{
        current_date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()
        }
    }

    current_date = increment_date(current_date)
    temp_date = increment_date(burndown_data[burndown_data.length-1][0])
    while (temp_date != current_date){
        new_data.push([temp_date, burndown_data[burndown_data.length-1][1]])
        temp_date = increment_date(temp_date)
    }
    return new_data


}

function display_burndown_chart(){
    /*
    Purpose: Displays a burndown chart on the front end
    Input: None
    Output: None
    */
    let burndown_data = issues_open_over_time(all_issues);
    // burndown_data = extend_burndown_to_current_date(burndown_data);
    burndown_dates = []
    burndown_open_values = []
    for(let i=0; i < burndown_data.length; i++){
        burndown_dates.push(date_format_change(burndown_data[i][0]))
        burndown_open_values.push(burndown_data[i][1])
    }
    number_of_total_open_issues = burndown_open_values[burndown_open_values.length-1]

    let ctx = document.getElementById('lineChart');
    let lineChart = new Chart(ctx, {
        type: 'line',
        options:{
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
            labels: burndown_dates,
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
            data: burndown_open_values
                }
            ]
        }
    });
}


function sort_dev_name() {
    // Purpose: Sort the developers name in lexicographical order and ensure all data for that developer is maintained in its relative order
    let dev_name_array2 = [];
    for (let i = 0; i < all_developers.length; i++) {
        dev_name_array2.push(all_developers[i].get_name());
    }
    
//    console.log("Dev name list before sorting")
//    console.log(dev_name_array2)
    
    for (let i = 1; i < all_developers.length; i++) {
        let current_dev = all_developers[i];
//        console.log(current_dev.get_name())
        j = i-1
        let previous_dev = all_developers[j];
//        console.log(previous_dev.get_name())
        
        // Skip over null developers
//        if (current_dev.get_name() == null) {
//            console.log("Reached a null name")
//            current_dev.developer_name
//            continue;
//        }
        
//        if (previous_dev.get_name() == null) {
//            console.log("Reached a null name")
//            continue;
//        }
        
//        console.log("About to lowercase the names")
        // Get the current developer name and capitalise it
        let current_name = current_dev.get_name();
        
        // Change null name to be the last name
        if (current_name == null) {
//            console.log("Reached a null name")
            current_name = "zNull Name"
        }
        
        current_name = current_name.charAt(0).toUpperCase() + current_name.slice(1)
        // Get the previous developer name and capitalise it
        let previous_name = previous_dev.get_name();
        
        // Change null name to be the last name
        if (previous_name == null) {
//            console.log("Reached a null name")
            previous_name = "zNull Name"
        }
        previous_name = previous_name.charAt(0).toUpperCase() + previous_name.slice(1)
        
        
        
        // Sort names
        while (j >= 0 && current_name < previous_name) {
            // Swap order
            all_developers[j+1] = all_developers[j]
            j -= 1
            // Update previous name if j >= 0
            if (j >= 0) {
                previous_name = all_developers[j].get_name();
                
                // Ignore null names
                if (previous_name == null) {
//                    console.log("Ignoring a previous name")
                    previous_name = "zNull Name"
                }
                previous_name = previous_name.charAt(0).toUpperCase() + previous_name.slice(1)
            }
        }
        all_developers[j+1] = current_dev
    }
    resetDevPage()
    
    // For printing purposes
//    let dev_name_array = [];
//    for (let i = 0; i < all_developers.length; i++) {
//        dev_name_array.push(all_developers[i].get_name());
//    }
//    console.log("Printing sorted dev list")
//    console.log(dev_name_array)
    
    // Display the developer names
    // display_sorted_dev_names()
//    console.log("done")
}

function sort_dev_name_reverse() {
    // Purpose: Sort the developers name in reverse lexicographical order and ensure all data for that developer is maintained in its relative order
    let dev_name_array = [];
    for (let i = 0; i < all_developers.length; i++) {
        dev_name_array.push(all_developers[i].get_name());
    }
    
//    console.log("Dev name list before sorting")
//    console.log(dev_name_array)
    
    for (let i = 1; i < all_developers.length; i++) {
        let current_dev = all_developers[i];
        j = i-1
        let previous_dev = all_developers[j];
        
        // Skip over null developers
        if (current_dev.get_name() == null) {
//            console.log("Reached a null name")
            continue;
        }
        
        if (previous_dev.get_name() == null) {
//            console.log("Reached a null name")
            continue;
        }
        
        // Get the current developer name and capitalise it
        let current_name = current_dev.get_name();
        current_name = current_name.charAt(0).toUpperCase() + current_name.slice(1)
        // Get the previous developer name and capitalise it
        let previous_name = previous_dev.get_name();
        previous_name = previous_name.charAt(0).toUpperCase() + previous_name.slice(1)
        
        // Sort names
        while (j >= 0 && current_name > previous_name) {
            // Swap order
            all_developers[j+1] = all_developers[j]
            j -= 1
            // Update previous name if j >= 0
            if (j >= 0) {
                
                // Ignore null names
                if (previous_name == null) {
//                    console.log("Ignoring a previous name")
                    continue;
                }
                
                previous_name = all_developers[j].get_name();
                previous_name = previous_name.charAt(0).toUpperCase() + previous_name.slice(1)
            }
        }
        all_developers[j+1] = current_dev
    }
    resetDevPage()
    
    // For printing purposes
//    let dev_name_array3 = [];
//    for (let i = 0; i < all_developers.length; i++) {
//        dev_name_array3.push(all_developers[i].get_name());
//    }
//    console.log("Printing sorted dev list")
//    console.log(dev_name_array3)
    
    // Display the developer names
    // display_sorted_dev_names()
//    console.log("done")
}

function sort_name_and_display_table() {
    // Purpose: To sort the developer names and display them in a table
    
    if (sorted_name == true) {
        // Set boolean to false
        sorted_name = false
        
        // Names were sorted last, so reverse sort
        sort_dev_name_reverse()
        display_total_issues_opened_closed()
        
    } else {
        // Set boolean to true
        sorted_name = true
        
        // Names were in reverse order last time, so sort them alphabetically
        sort_dev_name()
        display_total_issues_opened_closed()
    }
    resetDevPage()
}

function display_total_issues_opened_closed() {
    // Purpose: Display a table showing the developer name, number of open issues and the number of closed issues for that developer
    let tableref = document.getElementById("devNameIssuesCountTable")
    tableref.innerHTML = ''
    
    // Variables for creating the link
    let QueryString = '';
    let link = '';
    
    
    // console.log("About to display each developer")
    // Loop through all developers
    for (let i = 0; i < all_developers.length; i++) {
        const TR = document.createElement('TR')
        const dev_name = document.createElement('TD')
        const name_link = document.createElement('a')
        const open_issues = document.createElement('TD')
        const closed_issues = document.createElement('TD')
        
        name_link.innerHTML = all_developers[i].get_name();
        name_link.setAttribute("href", 'javascript:initialise_developer_page(' + i + ');');
        
        // Create a Query String containing the index of the developer
//        QueryString = "?index=" + i;
//        link = "developer.html" + QueryString
//        
//        console.log(link)
//        name_link.setAttribute("href", link)
        // window.location.href = link
        
        // dev_name.innerText = all_developers[i].get_name();
        open_issues.innerText = all_developers[i].total_open_issues();
        closed_issues.innerText = all_developers[i].total_closed_issues();
        dev_name.appendChild(name_link)
        TR.appendChild(dev_name)
        TR.appendChild(open_issues)
        TR.appendChild(closed_issues)
        
        tableref.appendChild(TR)
        
    }

}

function initialise_developer_page(index) {
    // Purpose: To transfer the all_developers list contents to the developer page
    // Written by: Kunj
    // Get the devleoper instance
    dev = all_developers[index];
    
    // Fetch the developer's 5 longest opne issues
    let open_issues = dev.get_5_longest_open_issues();
    let open_issues_list = [];
    for (i = 0; i < open_issues.length; i++) {
        let array = [open_issues[i].get_name(), open_issues[i].get_url(), open_issues[i].get_elapsed_time(), open_issues[i].get_creation_time()];
        open_issues_list.push(array);
    }
    
    let popular_issues_list = [];
    let popular_issues = dev.get_top_issues_by_comment()
    console.log(popular_issues);
    for (i = 0; i < popular_issues.length; i++) {
        let array = [popular_issues[i].get_name(), popular_issues[i].get_url(), popular_issues[i].commentCount];
        popular_issues_list.push(array);
    }
    
    let dev_metrics = { name: dev.get_name(), open_issues: open_issues_list, popular_issues: popular_issues_list};
    let json_dev_metrics = JSON.stringify(dev_metrics);
    
    // Store teh devloper data in Session Storage (To be retrieved in developer.js)
    sessionStorage.setItem("dev_metrics", json_dev_metrics);
    
    // Open the developer page
    window.open("developer.html");
}

function sort_open_and_display_table() {
    // Purpose: To sort the table by number of open issues per developer
    if (sorted_open_issues == true) {
        // Sort by decreasing order
        display_developers_by_open_ascending()
        // display_total_issues_opened_closed()
        // Set boolean to false
        sorted_open_issues = false
    } else {
        // Sort by ascending order
        display_developers_by_open_descending()
        // display_total_issues_opened_closed()
        
        // Set boolean to true
        sorted_open_issues = true
    }
    resetDevPage()
}

function sort_closed_and_display_table() {
    // Purpose: To sort the table by number of closed issues per developer
    if (sorted_closed_issues == true) {
        // Sort by decreasing order
        display_developers_by_close_ascending()
        // display_total_issues_opened_closed()
        // Set boolean to false
        sorted_closed_issues = false
    } else {
        // Sort by ascending order
        display_developers_by_close_descending()
        // display_total_issues_opened_closed()
        
        // Set boolean to true
        sorted_closed_issues = true
    }
    resetDevPage()
}

function display_developers_by_open_ascending() {
    // Purpose: Display the table of developer (their open and closed issues) based on number of open issues in ascending order
    for (let i=1; i < all_developers.length; i++){
        let current = all_developers[i]
        j = i - 1
        while (j >= 0 && current.total_open_issues() < all_developers[j].total_open_issues()){
            all_developers[j+1] = all_developers[j]
            j -= 1
        }
        all_developers[j+1] = current
    }

    display_total_issues_opened_closed()
        
}

function display_developers_by_open_descending() {
        // Purpose: Display the table of developer (their open and closed issues) based on number of open issues in descending order
    for (let i=1; i < all_developers.length; i++){
        let current = all_developers[i]
        j = i - 1
        while (j >= 0 && current.total_open_issues() > all_developers[j].total_open_issues()){
            all_developers[j+1] = all_developers[j]
            j -= 1
        }
        all_developers[j+1] = current
    }

    display_total_issues_opened_closed()
        
}

function display_developers_by_close_ascending() {
    // Purpose: Display the table of developer (their open and closed issues) based on number of close issues in ascending order
    for (let i=1; i < all_developers.length; i++){
        let current = all_developers[i]
        j = i - 1
        while (j >= 0 && current.total_closed_issues() < all_developers[j].total_closed_issues()){
            all_developers[j+1] = all_developers[j]
            j -= 1
        }
        all_developers[j+1] = current
    }

    display_total_issues_opened_closed()
        
}

function display_developers_by_close_descending() {
            // Purpose: Display the table of developer (their open and closed issues) based on number of close issues in descending order
    for (let i=1; i < all_developers.length; i++){
        let current = all_developers[i]
        j = i - 1
        while (j >= 0 && current.total_closed_issues() > all_developers[j].total_closed_issues()){
            all_developers[j+1] = all_developers[j]
            j -= 1
        }
        all_developers[j+1] = current
    }
    
    display_total_issues_opened_closed()
        
}

function remove_null_dev() {
    // Purpose: To remove the null developer that is in the all_developers list so that the table being displayed won't contain that null developer
    let index = 0;
    let found_null = false;
    
    for (let i=0; i < all_developers.length; i++) {
        current_developer = all_developers[i];
        if (current_developer.get_name() == null)
            index = i
            found_null = true
    }
    
    if (found_null == true) {
        all_developers.splice(index, 1);
    }
//    console.log("Should have removed the null dev")
//    console.log(all_developers)
}

function date_format_change(date) {
    let date_array = date.split("-")
    let year = date_array[0]
    let month = num_to_month(date_array[1])
    let day = date_array[2]
    return (month + ' ' + day + ', ' + year)
}

function num_to_month(month) {
    if (month == 1) {
        return 'Jan'
    }
    else if (month == 2) {
        return "Feb"
    }
    else if (month == 3) {
        return "Mar"
    }
    else if (month == 4) {
        return "Apr"
    }
    else if (month == 5) {
        return "May"
    }
    else if (month == 6) {
        return "Jun"
    }
    else if (month == 7) {
        return "Jul"
    }
    else if (month == 8) {
        return "Aug"
    }
    else if (month == 9) {
        return "Sep"
    }
    else if (month == 10) {
        return "Oct"
    }
    else if (month == 11) {
        return "Nov"
    }
    else if (month == 12) {
        return "Dec"
    }
}

//Test: console.log(date_format_change('2019-10-5'))