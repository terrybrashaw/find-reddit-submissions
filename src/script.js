async function fetch_reddit_search(query) {
    let encoded_query = encodeURIComponent(query);
    let request_url = `https://www.reddit.com/search.json?q=${encoded_query}&restrict_sr=&include_over_18=on&sort=top&t=all`;
    let request = {
        method: "GET",
        headers: new Headers({
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
        }),
    };
    let response = fetch(request_url, request);
    return response;
}

async function fetch_reddit_info(url) {
    let encoded_url = encodeURIComponent(url);
    let request_url = `https://www.reddit.com/api/info.json?raw_json=1&url=${encoded_url}`;
    let request = {
        method: "GET",
        headers: new Headers({
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
        }),
    };
    let response = fetch(request_url, request);
    return response;
}

async function get_posts() {
    let current_tab = await browser.tabs.query({active: true, currentWindow: true});
    let url = new URL(current_tab[0].url);

    let responses = [];
    responses.push(fetch_reddit_info(`${url.host}${url.pathname}${url.search}`));
    responses.push(fetch_reddit_info(`https://${url.host}${url.pathname}${url.search}`));
    responses.push(fetch_reddit_info(`http://${url.host}${url.pathname}${url.search}`));

    // In addition to querying the info of a specific URL, use Reddit's
    // search API to find other matches
    if(url.host === "www.youtube.com" || url.host === "youtube.com") {
        const YOUTUBE_ID_REGEX = /youtube.com\/watch.*?v=([a-zA-Z0-9_-]{11})/i;
        let ids = url.toString().match(YOUTUBE_ID_REGEX);
        if(ids !== null) {
            responses.push(fetch_reddit_search(`url:${ids[1]}`));
        }
    } else if(url.host === "www.youtu.be" || url.host === "youtu.be") {
        const YOUTUBE_SHORT_ID_REGEX = /youtu.be\/([a-zA-Z0-9_-]{11})/i;
        let ids = url.toString().match(YOUTUBE_SHORT_ID_REGEX);
        if(ids !== null) {
            responses.push(fetch_reddit_search(`url:${ids[1]}`));
        }
    } else if(url.host === "www.liveleak.com" || url.host === "liveleak.com") {
        const LIVELEAK_ID_REGEX = /liveleak.com\/.*?t=([a-zA-Z0-9_-]*?)(?:\&|$)/i;
        let ids = url.toString().match(LIVELEAK_ID_REGEX);
        if(ids !== null) {
            responses.push(fetch_reddit_search(`url:${ids[1]}`));
        }
    }

    // Collect all the responses in an object, indexed by their unique ID.
    // This is done to avoid listing duplicate posts.
    let posts = {};
    for(let i = 0; i < responses.length; i++) {
        let response_text = await responses[i];
        let response = await response_text.json();
        for(let i = 0; i < response.data.children.length; i++) {
            let post = response.data.children[i].data;
            posts[post.id] = post;
        }
    }

    // Return the 'hashmap' of posts as an array of posts.
    return Object.values(posts);
}

async function render_posts(posts) {
    if(posts.length == 0) {
        document.getElementById("error-content").style.display = "block";
        document.getElementById("popup-content").style.display = "none";
        return;
    }
    
    // Sort posts in descending order by number of comments.
    posts.sort((a, b) => b.num_comments - a.num_comments);

    let rendered_posts = [];
    for(let i = 0; i < posts.length; i++) {
        let post = posts[i];
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
