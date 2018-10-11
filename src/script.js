async function get_posts() {
    let current_tab = await browser.tabs.query({active: true, currentWindow: true});
    let url = new URL(current_tab[0].url);
    let urls = [
        `${url.host}${url.pathname}${url.search}`,
        `https://${url.host}${url.pathname}${url.search}`,
        `http://${url.host}${url.pathname}${url.search}`,
    ];

    let responses = [];
    for(let i = 0; i < urls.length; i++) {
        let encoded_url = encodeURIComponent(urls[i]);
        let request_url = `https://www.reddit.com/api/info/.json?raw_json=1&url=${encoded_url}`;
        let request = {
            method: "GET",
            headers: new Headers({
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
            }),
        };
        let response = fetch(request_url, request);
        responses.push(response);
    }

    let posts = [];
    for(let i = 0; i < responses.length; i++) {
        let response = await (await responses[i]).json();
        console.log(response);
        for(let i = 0; i < response.data.children.length; i++) {
            posts.push(response.data.children[i]);
        }
    }

    return posts;
}

async function render_posts(posts) {
    console.log(posts);

    if(posts.length == 0) {
        document.getElementById("error-content").style.display = "block";
        document.getElementById("popup-content").style.display = "none";
        return;
    }
    posts.sort((a, b) => b.data.num_comments - a.data.num_comments);
    let rendered_posts = [];
    for(let i = 0; i < posts.length; i++) {
        let post = posts[i].data;
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
        rendered_posts.push(html);
    }
    document.body.innerHTML = rendered_posts.join("\n");
}

get_posts().then(render_posts);
