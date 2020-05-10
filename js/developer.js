/*
Authors:    Kunj Dave       Akash Saggar
            Jiten Verma     Andrew Cao
            Sharan Sharabinth
Date created: 25/09/19
Date modified: 
*/


function initialise_data() {
    // Purpose: To retrieve the specific developer's d=metrics from the Session Storage
    let data = sessionStorage.getItem("dev_metrics");
    let dev_obj = JSON.parse(data);
    display_developer_name(dev_obj.name);
    initialise_metrics(dev_obj.open_issues, dev_obj.popular_issues)
}


function display_developer_name(dev_name) {
    // param dev_name: The index of all_developers2 array refering to the devloper whose name is to displayed
    // Purpose: To display the name of the given developer on the developer.html page
    let name = document.getElementById("title");
    name.innerHTML = dev_name;

}

function initialise_metrics(top_open_issues, most_popular_issues) {
    // Purpose: To display the data associated with the Developer on the page
    // param open_open_issues: A list of issues where each element conatins the name, url and time open
    
    // Ftech the issues list DOM
    let open_issue_list = document.getElementById("open_issues_list");
    
    // OLD UI - if uncommenting, uncomment the relevant html code as well
//    // Display the top 5 longest open issues
//    for (i = 0; i < top_open_issues.length; i++) {
//        // Create a bullet point using MDL design
//        let bullet_point = document.createElement("li");
//        bullet_point.setAttribute("class", "mdl-list__item");
//        
//        // Create a span to insert the name, symbol and time of the issue
//        let span = document.createElement("span");
//        span.setAttribute("class", "mdl-list__item-primary-content");
//        
//        // Create the image to be used as the bullet point
//        let image = document.createElement("i");
//        image.setAttribute("class", "material-icons mdl-list__item-avatar");
//        image.innerHTML = "assignment";
//        
//        // Display the issue name with link
//        let title = document.createElement("a");
//        title.innerHTML = top_open_issues[i][0];
//        title.setAttribute("href", top_open_issues[i][1]);
//        title.setAttribute("target", "_blank");
//        
//        // Display the time the issue has been opened for
//        let body_content = document.createElement("span");
//        body_content.setAttribute("class", "mdl-list__item-text-body");
//        body_content.setAttribute("align", "left");
//        body_content.innerHTML = "Opened for: " + top_open_issues[i][2][0];
//        
//        // Insert into the relevant DOMs
//        span.appendChild(image);
//        span.appendChild(title);
//        // span.appendChild(body_content);
//        bullet_point.appendChild(span);
//        open_issue_list.appendChild(bullet_point);
//    }
    
    // New UI
    let open_issues_table = document.getElementById("open_issues_table");
    for (i = 0; i < top_open_issues.length; i++) {
        // Create a bullet point using MDL design
        let TR = document.createElement("TR");
        TR.setAttribute("class", "zebra");
        let issue = document.createElement("TD");
        let body_content = document.createElement("TD");
        
        // Create a span to insert the name, symbol and time of the issue
        let span = document.createElement("span");
        span.setAttribute("class", "mdl-list__item-primary-content");
        
        // Display the issue name with link
        let title = document.createElement("a");
        title.innerHTML = top_open_issues[i][0];
        title.setAttribute("href", top_open_issues[i][1]);
        title.setAttribute("target", "_blank");
        
        // Converting time to remove the '/s' at the end
        time = top_open_issues[i][2][0];
        time = time.split(" ");
        unit = time[1];
        unit = unit.split("/")
        unit = unit[0]
        
        if (time[0] == 1) {
            top_open_issues[i][2][0] = "1 " + unit
        } else {
            top_open_issues[i][2][0] = time[0] + " " + unit + "s"
        }
    
        body_content.innerHTML = top_open_issues[i][2][0];
        
        // Insert into the relevant DOMs
        span.appendChild(title);
        issue.appendChild(span);
        TR.appendChild(issue);
        TR.appendChild(body_content)
        open_issues_table.appendChild(TR);
    } 
    
    if (top_open_issues.length == 0) {
        let issue = document.createElement("TD");
        
        // Create a span to insert the issue name, symbol 
        issue.innerHTML = "No issues to display!";
        issue.setAttribute("align", "center");
        
        // Insert into the relevant DOMs
        popular_table.appendChild(issue);
    }

    // Display the top 5 most popular issues
    
    // OLD UI
    // Ftech the issues list DOM
    /*
    let most_poppular_list = document.getElementById("popular_issues_list");
    
    // Display the top 5 most popular issues
    for (i = 0; i < most_popular_issues.length; i++) {
        
        // Create a bullet point using MDL design
        let bullet_point = document.createElement("li");
        bullet_point.setAttribute("class", "mdl-list__item");
        
        // Create a span to insert the issue name, symbol 
        let span = document.createElement("span");
        span.setAttribute("class", "mdl-list__item-primary-content");
        
        // Create the image to be used as the bullet point
        let image = document.createElement("i");
        image.setAttribute("class", "material-icons mdl-list__item-avatar");
        image.innerHTML = "people";
        
        // Display the issue name with link
        let title = document.createElement("a");
        title.innerHTML = most_popular_issues[i][0];
        title.setAttribute("href", most_popular_issues[i][1]);
        title.setAttribute("target", "_blank");
        
         // Display the number of comments on this issue
        let body_content = document.createElement("span");
        body_content.setAttribute("class", "mdl-list__item-text-body");
        body_content.setAttribute("align", "left");
        body_content.innerHTML = "No. of comments: " + most_popular_issues[i][2];
        
        // Insert into the relevant DOMs
        span.appendChild(image);
        span.appendChild(title);
        span.appendChild(body_content);
        bullet_point.appendChild(span);
        most_poppular_list.appendChild(bullet_point);
    }
    */
    // New UI
    let popular_table = document.getElementById("popular_issues_table");
    
    for (i = 0; i < most_popular_issues.length; i++) {
        
        // Create a bullet point using MDL design
        let TR = document.createElement("TR");
        TR.setAttribute("class", "zebra");
        let issue = document.createElement("TD");
        let body_content = document.createElement("TD");
        
        // Create a span to insert the issue name, symbol 
        let span = document.createElement("span");
        span.setAttribute("class", "mdl-list__item-primary-content");
        
        // Display the issue name with link
        let title = document.createElement("a");
        title.innerHTML = most_popular_issues[i][0];
        title.setAttribute("href", most_popular_issues[i][1]);
        title.setAttribute("target", "_blank");
        
         // Display the number of comments on this issue
        body_content.innerHTML = most_popular_issues[i][2] + " Comments";
        
        // Insert into the relevant DOMs
        span.appendChild(title);
        issue.appendChild(span);
        TR.appendChild(issue);
        TR.appendChild(body_content)
        popular_table.appendChild(TR);
    }
    
    if (most_popular_issues.length == 0) {
        let issue = document.createElement("TD");
        
        // Create a span to insert the issue name, symbol 
        issue.innerHTML = "No issues to display!";
        issue.setAttribute("align", "center");
        
        // Insert into the relevant DOMs
        popular_table.appendChild(issue);
    }
}

initialise_data();
