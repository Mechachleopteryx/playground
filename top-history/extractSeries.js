let forEachRecord = require('./lib/forEachRecord');

let inputFileName = process.argv[2] || 'subreddits.json';
let subreddit = process.argv[3] || 'dataisbeautiful';

let maxPostLifeSpan = 24 * 60 * 60 * 1000;
let posts = new Map();

forEachRecord(inputFileName, subredditSnapshot => {
  if (subredditSnapshot.name === subreddit) processSubreddit(subredditSnapshot)
}).then(saveSeries);

function processSubreddit(subredditSnapshot) {
  let currentTime = new Date(subredditSnapshot.time);
  let position = 1;
  subredditSnapshot.posts.forEach((post) => processPost(post, currentTime));

  function processPost(post, currentTime) {
    let postCreated = new Date(post.created_utc * 1000)
    let elapsed = currentTime - postCreated;
    if (elapsed > maxPostLifeSpan) return;
    let fiveMinutes = 5 * 60 * 1000;

    let postDataPoints = getOrCreatePostDataPoints(post.permalink)
    let band = Math.round(elapsed/fiveMinutes);
    postDataPoints.push({
      date: currentTime,
      score: post.score || 0,
      band,
      position,
      comments: post.num_comments || 0
    });

    position += 1;
  }
}


function getOrCreatePostDataPoints(postId) {
  let points = posts.get(postId);
  if (!points) {
    points = [];
    posts.set(postId, points);
  }

  return points;
}

function saveSeries() {
  console.log('post_id,date,band,score,comments,position');
  posts.forEach((points, postId) => printPostPoints(points, postId))
}

function printPostPoints(points, postId) {
  console.log(
    points.map(x => [
        postId, x.date.toISOString(), x.band, x.score, x.comments, x.position
      ].join(',')
    ).join('\n')
  );
}