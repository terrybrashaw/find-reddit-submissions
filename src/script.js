browser.tabs.query({active: true, currentWindow: true}).then(current_tab => {
    let url = current_tab[0].url;

    let urls = [
        url.trim
    ];

    let encoded_url = encodeURIComponent(url);
    let request_url = `https://www.reddit.com/api/info/.json?raw_json=1&url=${encoded_url}`;
    let request = {
        method: "GET",
        headers: new Headers({
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
        }),
    };

    let response = fetch(request_url, request)
        .then(response => response.json());

    return response;
}).then(response => {
    if(response.data.children.length == 0) {
        document.getElementById("error-content").style.display = "block";
        document.getElementById("popup-content").style.display = "none";
        return;
    }
    response.data.children.sort((a, b) => b.data.num_comments - a.data.num_comments);
    let posts = [];
    for(let i = 0; i < response.data.children.length; i++) {
        let post = response.data.children[i].data;
        let author;
        if(post.author === "[deleted]") {
            author = "[deleted]";
        } else {
            author = `u/${post.author}`;
        }

        let html = `
        <a href="https://reddit.com${post.permalink}" style="display: block">
            <div class="post">
                <div class="info">
                    <h1>${post.title}</h1>
                    <h2><b>r/${post.subreddit}</b> - Posted by ${author}</h2>
                <div class="stats">
                    <img src="../img/upvote.png" height="12" width="12"/>${post.score} <div class="comments">${post.num_comments}</div>
                </div>
                </div>
            </div>
        </a>
        `;
        posts.push(html);
    }
    document.body.innerHTML = posts.join("\n");
});
