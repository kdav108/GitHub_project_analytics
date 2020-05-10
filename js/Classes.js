/*
Authors:    Kunj Dave       Akash Saggar
            Jiten Verma     Andrew Cao
            Sharan Sharabinth
Date created: 25/09/19
Date modified: 
*/

// Global variables
let all_developers = [];

class Developer {
    constructor(name, issue){
            /* Inputs:
            name: String
            issue: an array containing Instances of 'Issue' class
            */
           this.name = name;
           this.issues = [issue];
    }
    get_name(){
        return this.name;
    }
    get_issues() {
        return this.issues;
    }
    
    get_5_longest_open_issues() {
        /*
        Purpose: To return the top 5 longest open issues for this developer
        */
        let top_5 = [];
        
        // Sort the developer's issues in decending order
        this.sort_issue_by_time(this.issues);
        
        // Take the first 5 issues from the now sorted issues array
        let i = 0;
        let n = 0;
        while (i<5 && n<this.issues.length) {
            if (this.issues[n].is_open()) {
                top_5[i] = this.issues[n];
                i += 1;
            }
            j += 1;
            n += 1;
        }
                
        return top_5;
    }
    
    get_top_issues_by_comment() {
        // NEED TESTING
        /*
        Purpose: To return the top 5 issues of this developer sorted by the number of comments on the issue
        */
        let top_5 = [];
         // Do not need to sort all the issues by comment, just need to run selection sort witht he outer loop running 5 times
        let issues_array = this.issues
        for (let i=0; i<5; i++) {
            let max = 0;
            let max_issue;
            for (let j=0; j<issues_array.length; j++) {
                if (issues_array[j].commentCount > max) {
                    if (!top_5.includes(issues_array[j])) {
                        max = issues_array[j].commentCount;
                        max_issue = issues_array[j]   
                    }
                }
            }
            if (max_issue != undefined) {
                top_5.push(max_issue)   
            }
        
        }
        return top_5
    }
    
    sort_issue_by_time(issues) {
        // Purpose: Sort the input array in descending order using bubble sort
        // input: an array of integers
        // output: nothing
        // post-condition: the issues array will be sorted in decending order
        for (let i = 0; i < issues.length; i++) {
            for (let j = 0; j < issues.length - 1; j++) {
                // If the current issue's open time is shorter than the next issue's open time, swap them
				if (issues[j].get_elapsed_time()[1] < issues[j+1].get_elapsed_time()[1]) {
                    let temp = issues[j];
                    issues[j] = issues[j+1];
                    issues[j+1] = temp;
                }    
            }
        }
    }
    
    total_open_issues() {
        // Purpose: Get the total number of open issues for this developer
        
        let total_open_issues = 0;
        // Loop through all issues and update the counter for open issues
        for (let i = 0; i < this.issues.length; i++) {
            let current_issue = this.issues[i];
            if (current_issue.is_open() == true) {
                total_open_issues += 1
            }
        }
        
        // console.log("Got the number of open issues");
        return total_open_issues;
    }
    
    
    total_closed_issues() {
        // Purpose: Get the total number of closed issues for this developer
        
        let total_closed_issues = 0;
        // Loop through all issues and update the counter for closed issues
        for (let i = 0; i < this.issues.length; i++) {
            let current_issue = this.issues[i];
            if (current_issue.is_open() == false) {
                total_closed_issues += 1
            }
        }
        
        // console.log("Got the number of closed issues");
        return total_closed_issues;
    }
    
}

class Issue {
    constructor(name, description, developers, creationTime, closedTime = null, commentCount, url) {
        /* Inputs:
            name: String
            description: String
            developers: Array of strings
            creationTime: String, format = '2019-09-10T12:05:18W'
            closedTime: String, format = '2019-09-10T12:05:18W'
        */
        
        this.name = name; // String: Name of the issue
        this.description = description; // String: Description of the issue
        this.developers = this.create_developer_array(developers); // Array of developer classes: The developers assigned to the issue
        this.creationTime = creationTime; // Time the issue was created
        this.closedTime = closedTime; // Time the issue was closed ('null' if the issue is still open)
        this.commentCount = commentCount // The number of comments on this issue
        this.url = url
    }
    
    create_developer_array(developers) {
        // Purpose: Create developer classes for each of the developers
        // Input: An array of strings
        // Output: An array of instantiations of 'Developer' class
        let developers_array = [];
        for (let i = 0; i < developers.length; i++) {
            let exist = this.developer_exist(developers[i]);
            if (exist){
                exist.issues.push(this)
                developers_array.push(exist);
            }
            else{
                let new_developer = new Developer(developers[i], this);
                developers_array.push(new_developer);
                all_developers.push(new_developer);
            }
        }
        return developers_array;
    }

    developer_exist(developer){
        for (let i = 0; i < all_developers.length; i++) {
            if (developer == all_developers[i].get_name()) {
                return all_developers[i];
            }
        }
        return false;
    }

    get_name() {
        return this.name;
    }
    get_description() {
        return this.description;
    }
    get_developers() {
        return this.developers;
    }
    is_open() {
        // If the closed time is not null return false since the issue has been closed, else retunr true
        if (this.closedTime) {
            return false;
        }
        else {
            return true;
        }
    }
    get_creation_time() {
        return this.creationTime;
    }
    get_closed_time() {
        return this.closedTime;
    }
    get_comment_count() {
        return this.commentCount
    }
    get_url() {
        return this.url
    }
    get_elapsed_time() {
        //Purpose: Gets the time an issue has been open for
        //Output: The following array: [Useful time, Exact time]
        //Useful time = Time shown in varying formats, for displaying on the UI
        //Exact time = The exact time in days used for calculation and sorting purposes
        let current_time = this.get_creation_time();
        let current_time_array = [parseInt(current_time.slice(0, 4)), parseInt(current_time.slice(5, 7)), parseInt(current_time.slice(8, 10)), parseInt(current_time.slice(11, 13)), parseInt(current_time.slice(14, 16)), parseInt(current_time.slice(17, 19))];
        let time_difference = [];
        let final_time_array = []
        if (this.get_closed_time() != null) {
            let final_time = this.get_closed_time();
            final_time_array = [parseInt(final_time.slice(0, 4)), parseInt(final_time.slice(5, 7)), parseInt(final_time.slice(8, 10)), parseInt(final_time.slice(11, 13)), parseInt(final_time.slice(14, 16)), parseInt(final_time.slice(17, 19))];
        }
        else{
            let today = new Date;
            final_time_array = [today.getFullYear(), today.getMonth() + 1, today.getDate(), today.getHours(), today.getMinutes(), today.getSeconds()];
        }

        for(let i = 0; i < 6; i++) {
            time_difference[i] = final_time_array[i] - current_time_array[i]
        }
        time_difference[1] = 0
        let month_difference = Math.abs(current_time_array[1] - final_time_array[1])
        for (let i = 0; i < month_difference; i++) {
            let current_month = (current_time_array[1] + i) % 12
            let days_in_month = this.get_month_days(current_month)
            time_difference[1] = time_difference[1] + days_in_month
        }
        if ((final_time_array[1] - current_time_array[1]) < 0) {
            time_difference[1] = -1 * time_difference[1]
        }
        // console.log(time_difference)
        return [this.get_useful_time(time_difference), this.get_exact_time(time_difference)];  
    }
    get_month_days(month) {
        //Purpose: Determines how many months are in the given month
        //Input: Month number
        //Output: Number of days in that month
        if (month == 2) {
            return 28
        }
        else if (month == 1 | month == 3 | month == 5 | month == 7 | month == 8 | month == 10 | month == 12) {
            return 31
        }
        else {
            return 30
        }

    }
    get_useful_time(time_difference) {
        //Purpose: Determines time to be displayed on UI
        //Input: Array of time differences
        //Output: String of time and format
        let exact_days = this.get_exact_time(time_difference)
        if (exact_days == 1 | exact_days > 1) {
            let exact_years = exact_days / 365
            if (exact_years == 1 | exact_years > 1) {
                return String(Math.floor(exact_years)) + ' Year/s'
            }
            else if (exact_days == 7 | exact_days > 7) {
                let exact_weeks = exact_days / 7
                return String(Math.floor(exact_weeks)) + ' Week/s'
            }
            else {
                return String(Math.floor(exact_days)) + ' Day/s'
            }
        }
        else {
            let exact_hours = exact_days * 24
            if (exact_hours == 1 | exact_hours > 1) {
                return String(Math.floor(exact_hours)) + ' Hour/s'
            }
            let exact_minutes = exact_days * 24 * 60
            if (exact_minutes == 1 | exact_minutes > 1) {
                return String(Math.floor(exact_minutes)) + ' Minute/s'
            }
            let exact_seconds = exact_days * 24 * 60 * 60
            return String(Math.floor(exact_seconds)) + ' Second/s'            
        }
    }

    get_exact_time(time_difference) {
        //Purpose: Determines time in days for calculations
        //Input: Array of time differences
        //Output: Number of days
         return ((time_difference[0] * 365) + time_difference[1] + time_difference[2] + (time_difference[3] / 24) + (time_difference[4] / (24 * 60)) + (time_difference[5] / (60 * 60 * 24)))
    }

    get_developer_count() {
        return this.developers.length
    }
  
}