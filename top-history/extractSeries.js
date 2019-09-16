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
  currentTime.setSeconds(0);
  let position = 1;
  subredditSnapshot.posts.forEach((post) => processPost(post, currentTime));

  function processPost(post, currentTime) {
    let postCreated = new Date(post.created_utc * 1000)
    let elapsed = currentTime - postCreated;
    if (elapsed > maxPostLifeSpan) return;
    let fiveMinutes = 5 * 60 * 1000;

    let postDataPoints = getOrCreatePostDataPoints(post.permalink)
    let band = Math.round(elapsed/fiveMinutes);
    const nextScore = post.score || 0;
    const nextComments = post.num_comments || 0;

    if (postDataPoints.length === 0 && band > 0) {
      postDataPoints.push({
        date: currentTime,
        band: band,
        score: nextScore,
        position,
        comments: nextComments,
        velocity: 0
      })
      return;
    }

    let prevPoint = postDataPoints[postDataPoints.length - 1] || {
      date: (new Date(currentTime)).setMilliseconds(-fiveMinutes),
      band: -1,
      score: 0,
      comments: 0,
    };

    let bandDiff = (band - prevPoint.band);
    let velocity = (nextScore - prevPoint.score)/bandDiff;
    let dComments = (nextComments - prevPoint.comments)/bandDiff;
    while (bandDiff > 0) {
      let time = new Date(prevPoint.date);
      time.setMilliseconds(fiveMinutes);
      let nextPoint = {
        date: time,
        band: prevPoint.band + 1,
        score: prevPoint.score + velocity,
        position,
        comments: prevPoint.comments + dComments,
        velocity: velocity
      };
      postDataPoints.push(nextPoint);
      prevPoint = nextPoint;
      bandDiff -= 1;
    }

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
  console.log('post_id,date,band,score,scoreAt24h,velocity,comments,position');
  posts.forEach((points, postId) => printPostPoints(points, postId))
}

function printPostPoints(points, postId) {
  let scoreAt24hMark = getScoreAt24HMark(points);
  if (scoreAt24hMark === undefined) {
    return; // we couldn't collect this, so can't learn from it.
  }
  console.log(
    points.map(x => {
      return [
        postId, x.date.toISOString(), x.band, x.score, scoreAt24hMark, x.velocity, x.comments, x.position
      ].join(',')
    }).join('\n')
  );
}

function getScoreAt24HMark(points) {
  // if (points.length < 288) return;
  // for (let i = 0; i < 288; ++i) {
  //   if (points[i].band !== i) {
  //     debugger;
  //     return;
  //   }
  // }
  // return points[287].score;

  for (let i = points.length - 1; i > 0; i--) {
    let post = points[i];
    if (post.band === 287) return post.score;
    if (post.band < 287) return;
  }
}
