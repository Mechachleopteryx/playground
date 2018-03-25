function getData() {
  return {
  name: 'Overview',
  html: `
<p>
To make great products:
<b>do machine learning like the great engineer you are, not like the great machine learning
expert you aren’t.</b>
</p>
<p>
Most of the problems you will face are, in fact, engineering problems. Even with all the
resources of a great machine learning expert, most of the gains come from great features, not
great machine learning algorithms. So, the basic approach is:
</p>
<ol>
  <li>make sure your pipeline is solid end to end</li>
  <li>start with a reasonable objective</li>
  <li>add common­-sense features in a simple way</li>
  <li>make sure that your pipeline stays solid.</li>
</ol>
<p>
This approach will make lots of money and/or make lots of people happy for a long period of
time. Diverge from this approach only when there are no more simple tricks to get you any
farther. Adding complexity slows future releases.
</p>
<p>
Once you've exhausted the simple tricks, cutting­edge machine learning might indeed be in your
future. See the section on Phase III machine learning projects.
</p>
<p> 
This document is arranged in four parts:
<ol>
<li>The first part should help you understand whether the time is right for building a machine learning system.</li>
<li>The second part is about deploying your first pipeline.</li>
<li>The third part is about launching and iterating while adding new features to your pipeline, how to evaluate models and training­serving skew.</li>
<li>The final part is about what to do when you reach a plateau.</li>
<li>Afterwards, there is a list of related work and an appendix with some background on the systems commonly used as examples in this document.</li>
</ol>
</p>
 `,
  children: [{
    name: 'Before Machine Learning',
    html: `
    <p>
This part should help you understand whether the time is right for building a machine learning system.
</p>
    `,
    children: [
      {
        name: "Rule #1: Don’t be afraid to launch a product without machine learning.",
        html: `
<p>Machine learning is cool, but it requires data. Theoretically, you can take data from a different problem and then tweak the model for a new product, but this will likely underperform basic heuristics. If you think that machine learning will give you a 100% boost, then a heuristic will get you 50% of the way there.</p>
<p>
For instance, if you are ranking apps in an app marketplace, you could use the install rate or number of installs as heuristics. If you are detecting spam, filter out publishers that have sent spam before. Don’t be afraid to use human editing either. If you need to rank contacts, rank the most recently used highest (or even rank alphabetically). If machine learning is not absolutely required for your product, don't use it until you have data.
</p>
        `
    },
      {name: "Rule #2: First, design and implement metrics.", 
    html: `
    <p>
Before formalizing what your machine learning system will do, track as much as possible in your current system. Do this for the following reasons:
</p>

<ol>
<li>It is easier to gain permission from the system’s users earlier on.</li>
<li>If you think that something might be a concern in the future, it is better to get historical data now.</li>
<li>If you design your system with metric instrumentation in mind, things will go better for you in the future. Specifically, you don’t want to find yourself grepping for strings in logs to instrument your metrics!</li>
<li>You will notice what things change and what stays the same. For instance, suppose you want to directly optimize one­-day active users. However, during your early manipulations of the system, you may notice that dramatic alterations of the user experience don’t noticeably change this metric.</li>
</ol>

<p>
Google Plus team measures expands per read, reshares per read, plus­ones per read, comments/read, comments per user, reshares per user, etc. which they use in computing the goodness of a post at serving time. Also, note that an experiment framework, in which you can group users into buckets and aggregate statistics by experiment, is important. See
<a href='#' data-path='0:1:2:0'>Rule #12.</a>
</p>

<p>
By being more liberal about gathering metrics, you can gain a broader picture of your system. Notice a problem? Add a metric to track it! Excited about some quantitative change on the last release? Add a metric to track it!
</p>
    `},
      {name: "Rule #3: Choose machine learning over a complex heuristic.",
      html: `
      <p>A simple heuristic can get your product out the door. A complex heuristic is unmaintainable. Once you have data and a basic idea of what you are trying to accomplish, move on to machine learning. As in most software engineering tasks, you will want to be constantly updating your approach, whether it is a heuristic or a machine­learned model, and you will find that the machine­-learned model is easier to update and maintain (see
        <a href='#' data-path='0:2:0:0'>Rule #16</a>).</p>
      `
    }
    ]
  }, {
    name: 'ML Phase I',
    html: `This part is about deploying your first pipeline.`,
    children: [{
        name: 'Your First Pipeline',
        html: `
<p>
    Focus on your system infrastructure for your first pipeline. While it is fun to think about all the imaginative machine learning you are going to do, it will be hard to figure out what is happening if you don’t first trust your pipeline.
</p>`,
        children: [
          {name: 'Rule #4: Keep the first model simple and get the infrastructure right.',
        html: `
<p>
The first model provides the biggest boost to your product, so it doesn't need to be fancy. But you will run into many more infrastructure issues than you expect. Before anyone can use your fancy new machine learning system, you have to determine:
</p> 

<ul>
<li>How to get examples to your learning algorithm.</li>
<li>A first cut as to what "good" and "bad" mean to your system.</li>
<li>How to integrate your model into your application. You can either apply the model live, or pre­compute the model on examples offline and store the results in a table. For example, you might want to pre­classify web pages and store the results in a table, but you might want to classify chat messages live.</li>
</ul>
<p>
Choosing simple features makes it easier to ensure that:
</p>

<ul>
<li>The features reach your learning algorithm correctly.</li>
<li>The model learns reasonable weights.</li>
<li>The features reach your model in the server correctly.</li>
</ul>

<p>
Once you have a system that does these three things reliably, you have done most of the work. Your simple model provides you with baseline metrics and a baseline behavior that you can use to test more complex models. Some teams aim for a "neutral" first launch: a first launch that explicitly de­prioritizes machine learning gains, to avoid getting distracted.
</p>
        `},
          {name: 'Rule #5: Test the infrastructure independently from the machine learning.', 
        html: `
        <p>
Make sure that the infrastructure is testable, and that the learning parts of the system are encapsulated so that you can test everything around it. Specifically:
</p>

<ol>
<li>Test getting data into the algorithm. Check that feature columns that should be populated are populated. Where privacy permits, manually inspect the input to your training algorithm. If possible, check statistics in your pipeline in comparison to statistics for the same data processed elsewhere.</li>
<li>Test getting models out of the training algorithm. Make sure that the model in your training environment gives the same score as the model in your serving environment (see <a href='#' data-path='0:2:2:8'>Rule #37</a> ).</li>
</ol>
Machine learning has an element of unpredictability, so make sure that you have tests for the code for creating examples in training and serving, and that you can load and use a fixed model during serving. Also, it is important to understand your data: see <a href='http://www.unofficialgoogledatascience.com/2016/10/practical-advice-for-analysis-of-large.html'> Practical Advice for Analysis of Large, Complex Data Sets.</a>'
`},
          {name: 'Rule #6: Be careful about dropped data when copying pipelines.',
        html: `
<p>Often we create a pipeline by copying an existing pipeline (i.e., <a href='https://en.wikipedia.org/wiki/Cargo_cult_programming'>cargo cult programming</a>),
 and the old pipeline drops data that we need for the new pipeline. For example, the pipeline for
  Google Plus What’s Hot drops older posts (because it is trying to rank fresh posts).
  This pipeline was copied to use for Google Plus Stream, where older posts are still meaningful,
  but the pipeline was still dropping old posts. Another common pattern is to only log data that was 
  seen by the user. Thus, this data is useless if we want to model why a particular post was not 
  seen by the user, because all the negative examples have been dropped. A similar issue occurred 
  in Play. While working on Play Apps Home, a new pipeline was created that also contained examples 
  from the landing page for Play Games without any feature to disambiguate where each example came from.
</p>`},
          {name: 'Rule #7: Turn heuristics into features, or handle them externally.',
        html: `
<p>
Usually the problems that machine learning is trying to solve are not completely new. 
There is an existing system for ranking, or classifying, or whatever problem you are trying to solve. 
This means that there are a bunch of rules and heuristics. 
<b>These same heuristics can give you a lift when tweaked with machine learning.</b> Your heuristics
should be mined for whatever information they have, for two reasons. First, the transition to a machine
 learned system will be smoother. Second, usually those rules contain a lot of the intuition about the 
 system you don’t want to throw away. There are four ways you can use an existing heuristic:
</p>

<ul>
<li>Preprocess using the heuristic. If the feature is incredibly awesome, then this is an option. For example, if, in a spam filter, the sender has already been blacklisted, don’t try to relearn what "blacklisted" means. Block the message. This approach makes the most sense in binary classification tasks.</li>
<li>Create a feature. Directly creating a feature from the heuristic is great. For example, if you use a heuristic to compute a relevance score for a query result, you can include the score as the value of a feature. Later on you may want to use machine learning techniques to massage the value (for example, converting the value into one of a finite set of discrete values, or combining it with other features) but start by using the raw value produced by the heuristic.</li>
<li>Mine the raw inputs of the heuristic. If there is a heuristic for apps that combines the number of installs, the number of characters in the text, and the day of the week, then consider pulling these pieces apart, and feeding these inputs into the learning separately. Some techniques that apply to ensembles apply here (see <a href='#' data-path='0:3:0:2'>Rule #40</a>).</li>
<li>Modify the label. This is an option when you feel that the heuristic captures information not currently contained in the label. For example, if you are trying to maximize the number of downloads, but you also want quality content, then maybe the solution is to multiply the label by the average number of stars the app received. There is a lot of leeway here. See <a href='#' data-path='0:1:2'>"Your First Objective"</a>.</li>
</ul>
<p>
Do be mindful of the added complexity when using heuristics in an ML system. Using old heuristics in your new machine learning algorithm can help to create a smooth transition, but think about whether there is a simpler way to accomplish the same effect.
</p>
`}
        ]
      }, {
        name: 'Monitoring',
        html: `<p>In general, practice good alerting hygiene, such as making alerts actionable and having a dashboard page.
</p>`,
        children: [
          {name: 'Rule #8: Know the freshness requirements of your system.',
        html: `<p>How much does performance degrade if you have a model that is a day old? A week old? A quarter old? This information can help you to understand the priorities of your monitoring. If you lose significant product quality if the model is not updated for a day, it makes sense to have an engineer watching it continuously. Most ad serving systems have new advertisements to handle every day, and must update daily. For instance, if the ML model for Google Play Search is not updated, it can have a negative impact in under a month. Some models for What’s Hot in Google Plus have no post identifier in their model so they can export these models infrequently. Other models that have post identifiers are updated much more frequently. Also notice that freshness can change over time, especially when feature columns are added or removed from your model.</p>`},
          {name: 'Rule #9: Detect problems before exporting models.',
        html: `
<p>Many machine learning systems have a stage where you export the model to serving. If there is an issue with an exported model, it is a user­-facing issue.</p>
<p>
        Do sanity checks right before you export the model. Specifically, make sure that the model’s performance is reasonable on held out data. 
        Or, if you have lingering concerns with the data, don’t export a model.
        Many teams continuously deploying models check the area under the ROC curve (or AUC) before exporting.
        <b>Issues about models that haven’t been exported require an e­mail alert, but issues on a user-facing
        model may require a page</b>. So better to wait and be sure before impacting users.</p>`},
          {name: 'Rule #10: Watch for silent failures.',
        html: `
        <p>This is a problem that occurs more for machine learning systems than for other kinds of systems. Suppose that a particular table that is being joined is no longer being updated. The machine learning system will adjust, and behavior will continue to be reasonably good, decaying gradually. Sometimes you find tables that are months out of date, and a simple refresh improves performance more than any other launch that quarter! The coverage of a feature may change due to implementation changes: for example a feature column could be populated in 90% of the examples, and suddenly drop to 60% of the examples. Play once had a table that was stale for 6 months, and refreshing the table alone gave a boost of 2% in install rate. If you track statistics of the data, as well as manually inspect the data on occassion, you can reduce these kinds of failures.</p>`},
          {name: 'Rule #11: Give feature sets owners and documentation.',
        html: `
        <p>If the system is large, and there are many feature columns, know who created or is maintaining each feature column. If you find that the person who understands a feature column is leaving, make sure that someone has the information. Although many feature columns have descriptive names, it's good to have a more detailed description of what the feature is, where it came from, and how it is expected to help.</p>`}
        ]
      }, {
        name: 'Your First Objective',
        html: `
        <p>You have many metrics, or measurements about the system that you care about,
         but your machine learning algorithm will often require a single <b>objective, a number that your
        algorithm is "trying" to optimize</b>. I distinguish here between objectives and metrics: a metric is any number that your system reports, which may or may not be important. 
        See also <a href='#' data-path='0:0:1'>Rule #2</a>.</p>`,
        children: [
          {name: 'Rule #12: Don’t overthink which objective you choose to directly optimize.', 
        html: `
<p>You want to make money, make your users happy, and make the world a better place. There are tons of metrics that you care about, and you should measure them all (see <a href='#' data-path='0:0:1'>Rule #2</a>). However, early in the machine learning process, you will notice them all going up, even those that you do not directly optimize. For instance, suppose you care about number of clicks and time spent on the site. If you optimize for number of clicks, you are likely to see the time spent increase.</p>

<p>So, keep it simple and don’t think too hard about balancing different metrics when you can still easily increase all the metrics. Don’t take this rule too far though: do not confuse your objective with the ultimate health of the system (see <a href='#' data-path='0:3:0:1'>Rule #39</a>).
And, <b>if you find yourself increasing the directly optimized metric, but deciding not to launch, some objective revision may be required</b>.</p>
        `},
          {name: 'Rule #13: Choose a simple, observable and attributable metric for your first objective.',
        html: `
        <p>Often you don't know what the true objective is. You think you do but then as
        you stare at the data and side-by-side analysis of your old system and new ML
        system, you realize you want to tweak the objective. Further, different team
        members often can't agree on the true objective. <b>The ML objective should be
        something that is easy to measure and is a proxy for the "true" objective.</b>
        In fact, there is often no "true" objective (see
        <a href="#" data-path='0:3:0:1'>Rule#39</a>).
        So
        train on the simple ML objective, and consider having a "policy layer" on top
        that allows you to add additional logic (hopefully very simple logic) to do
        the final ranking.</p>
        <p>The easiest thing to model is a user behavior that is directly observed and attributable to an
action of the system:</p>
<ul>
<li>Was this ranked link clicked?</li>
<li>Was this ranked object downloaded?</li>
<li>Was this ranked object forwarded/replied to/e­mailed?</li>
<li>Was this ranked object rated?</li>
<li>Was this shown object marked as spam/pornography/offensive?</li>
</ul>
<p>Avoid modeling indirect effects at first:</p>
<ul>
<li>Did the user visit the next day?</li>
<li>How long did the user visit the site?</li>
<li>What were the daily active users?</li>
</ul>
<p>Indirect effects make great metrics, and can be used during A/B testing and during launch
decisions.</p>
<p>Finally, don’t try to get the machine learning to figure out:</p>
<ul>
<li>Is the user happy using the product?</li>
<li>Is the user satisfied with the experience?</li>
<li>Is the product improving the user’s overall well­being?</li>
<li>How will this affect the company’s overall health?</li>
</ul>
<p>These are all important, but also incredibly hard to measure. Instead, use
proxies: if the user is happy, they will stay on the site longer. If the user
is satisfied, they will visit again tomorrow. Insofar as well-being and
company health is concerned, human judgement is required to connect any
machine learned objective to the nature of the product you are selling and
your business plan.</p>
`},
          {name: 'Rule #14: Starting with an interpretable model makes debugging easier.', 
        html: `
        <p>Linear regression, logistic regression, and Poisson regression are directly
        motivated by a probabilistic model. Each prediction is interpretable as a
        probability or an expected value. This makes them easier to debug than models
        that use objectives (zero­-one loss, various hinge losses, and so on) that try
        to directly optimize classification accuracy or ranking performance. For
        example, if probabilities in training deviate from probabilities predicted in
        side­-by-­sides or by inspecting the production system, this deviation could
        reveal a problem.</p>
        <p>For example, in linear, logistic, or Poisson regression, <strong>there are subsets of
        the data where the average predicted expectation equals the average label (1-
        moment calibrated, or just calibrated)</strong>. This is true assuming that you have no
        regularization and that your algorithm has converged, and it is approximately
        true in general. If you have a feature which is either 1 or 0 for each example,
        then the set of 3 examples where that feature is 1 is calibrated. Also, if you
        have a feature that is 1 for every example, then the set of all examples is
        calibrated.</p>
        <p>With simple models, it is easier to deal with feedback loops (see
          <a href="#" data-path='0:2:2:7'>Rule #36</a>).
          Often, we use these probabilistic predictions to make a decision: e.g. rank
          posts in decreasing expected value (i.e. probability of click/download/etc.).
          <strong>However, remember when it comes time to choose which model to use, the
          decision matters more than the likelihood of the data given the model (see
          <a href="#" data-path='0:2:1:4'>Rule #27</a>).</strong></p>
`},
          {name: 'Rule #15: Separate Spam Filtering and Quality Ranking in a Policy Layer.',
        html: `
        <p>Quality ranking is a fine art, but spam filtering is a war. The signals that
you use to determine high quality posts will become obvious to those who use
your system, and they will tweak their posts to have these properties. Thus,
your quality ranking should focus on ranking content that is posted in good
faith. You should not discount the quality ranking learner for ranking spam
highly. <strong>Similarly, "racy" content should be handled separately from Quality
Ranking.</strong> Spam filtering is a different story. You have to expect that the
features that you need to generate will be constantly changing. Often, there
will be obvious rules that you put into the system (if a post has more than
three spam votes, don’t retrieve it, et cetera). Any learned model will have
to be updated daily, if not faster. The reputation of the creator of the
content will play a great role.</p>
<p>At some level, the output of these two systems will have to be integrated. Keep
in mind, filtering spam in search results should probably be more aggressive
than filtering spam in email messages. This is true assuming that you have no
regularization and that your algorithm has converged. It is approximately true
in general. Also, it is a standard practice to remove spam from the training
data for the quality classifier.</p>
`}
        ]
      }
    ]
  }, {
    name: 'ML Phase II',
    html: `<p>The third part is about launching and iterating while adding new features to your pipeline, how to evaluate models and training-serving skew.</p>`,
    children: [{
      name: 'Feature Engineering',
      html: `
      <p>In the first phase of the lifecycle of a machine learning system, the
important issues are to get the training data into the learning system, get any
metrics of interest instrumented, and create a serving infrastructure. <strong>After
you have a working end to end system with unit and system tests instrumented,
Phase II begins.</strong></p>
<p>In the second phase, there is a lot of low-hanging fruit. There are a variety
of obvious features that could be pulled into the system. Thus, the second
phase of machine learning involves pulling in as many features as possible and
combining them in intuitive ways. During this phase, all of the metrics should
still be rising. There will be lots of launches, and it is a great time to
pull in lots of engineers that can join up all the data that you need to
create a truly awesome learning system.</p>`,
      children: [
        {name: 'Rule #16: Plan to launch and iterate.',
      html: `
      <p>Don’t expect that the model you are working on now will be the last one that
      you will launch, or even that you will ever stop launching models. Thus
      consider whether the complexity you are adding with this launch will slow down
      future launches. Many teams have launched a model per quarter or more for
      years. There are three basic reasons to launch new models:</p>
      <ul>
<li>You are coming up with new features.</li>
<li>You are tuning regularization and combining old features in new ways.</li>
<li>You are tuning the objective.</li>
</ul>
<p>Regardless, giving a model a bit of love can be good: looking over the data
feeding into the example can help find new signals as well as old, broken
ones. So, as you build your model, think about how easy it is to add or remove
or recombine features. Think about how easy it is to create a fresh copy of
the pipeline and verify its correctness. Think about whether it is possible to
have two or three copies running in parallel. Finally, don’t worry about
whether feature 16 of 35 makes it into this version of the pipeline. You’ll
get it next quarter.</p>`
    },
        {name: 'Rule #17: Start with directly observed and reported features as opposed to learned features.',
      html: `
      <p>This might be a controversial point, but it avoids a lot of pitfalls. First of
all, let’s describe what a learned feature is. A learned feature is a feature
generated either by an external system (such as an unsupervised clustering
system) or by the learner itself (e.g. via a factored model or deep learning).
Both of these can be useful, but they can have a lot of issues, so they should
not be in the first model.</p>
<p>If you use an external system to create a feature, remember that the external
system has its own objective. The external system's objective may be only weakly
correlated with your current objective. If you grab a snapshot of the external
system, then it can become out of date. If you update the features from the
external system, then the meanings may change. If you use an external system to
provide a feature, be aware that this approach requires a great deal of care.</p>
<p>The primary issue with factored models and deep models is that they are
non­convex. Thus, there is no guarantee that an optimal solution can be
approximated or found, and the local minima found on each iteration can be
different. This variation makes it hard to judge whether the impact of a
change to your system is meaningful or random. By creating a model without
deep features, you can get an excellent baseline performance. After this
baseline is achieved, you can try more esoteric approaches.</p>
`},
        {name: 'Rule #18: Explore with features of content that generalize across contexts.',
      html: `
      <p>Often a machine learning system is a small part of a much bigger picture. For
      example, if you imagine a post that might be used in What’s Hot, many people
      will plus-one, reshare, or comment on a post before it is ever shown in What's
      Hot. If you provide those statistics to the learner, it can promote new posts
      that it has no data for in the context it is optimizing.
      YouTube Watch Next could use number of watches, or co-
      watches (counts of how many times one video was watched after another was
      watched) from YouTube search. You can also use explicit
      user ratings. Finally, if you have a user action that you are using as a label,
      seeing that action on the document in a different context can be a great
      feature. All of these features allow you to bring new content into the context.
      Note that this is not about personalization: figure out if someone likes the
      content in this context first, then figure out who likes it more or less.</p>
      `},
        {name: 'Rule #19: Use very specific features when you can.', 
      html: `
      <p>With tons of data, it is simpler to learn millions of simple features than a
      few complex features. Identifiers of documents being retrieved and
      canonicalized queries do not provide much generalization, but align your
      ranking with your labels on head queries. Thus, don’t be afraid of groups of
      features where each feature applies to a very small fraction of your data, but
      overall coverage is above 90%. You can use regularization to eliminate the
      features that apply to too few examples.</p>`},
        {name: 'Rule #20: Combine and modify existing features to create new features in human­-understandable ways.',
      html: `
      <p>There are a variety of ways to combine and modify features. Machine learning
      systems such as TensorFlow allow you to pre-process your data through
      <a href="https://www.tensorflow.org/tutorials/linear#feature-columns-and-transformations">transformations</a>.
      The two most standard approaches are "discretizations" and "crosses".</p>
      <p>Discretization consists of taking a continuous feature and creating many
discrete features from it. Consider a continuous feature such as age. You can
create a feature which is 1 when age is less than 18, another feature which is
1 when age is between 18 and 35, et cetera. Don’t overthink the boundaries of
these histograms: basic quantiles will give you most of the impact.</p>
<p>Crosses combine two or more feature columns. A feature column, in TensorFlow's
terminology, is a set of homogenous features, (e.g. {male, female}, {US,
Canada, Mexico}, et cetera). A cross is a new feature column with features in,
for example, {male, female} × {US,Canada, Mexico}. This new feature column
will contain the feature (male, Canada). If you are using TensorFlow and you
tell TensorFlow to create this cross for you, this (male, Canada) feature will
be present in examples representing male Canadians. Note that it takes massive
amounts of data to learn models with crosses of three, four, or more base
feature columns.</p>
<p>Crosses that produce very large feature columns may overfit. For instance,
imagine that you are doing some sort of search, and you have a feature column
with words in the query, and you have a feature column with words in the
document. You can combine these with a cross, but you will end up with a lot of
features (see <a href="#" data-path='0:2:0:5'>Rule #21</a>).</p>
<p>When working with text there are two alternatives. The most draconian is a
dot product. A dot product in its simplest form simply counts the number of
words in common between the query and the document. This feature can then be
discretized. Another approach is an intersection: thus, we will have a feature
which is present if and only if the word "pony" is in both the document and the
query, and another feature which is present if and only if the word "the" is in
both the document and the query.</p>
`},
        {name: 'Rule #21: The number of feature weights you can learn in a linear model is roughly proportional to the amount of data you have.',
      html: `
      <p>There are fascinating statistical learning theory results concerning the
      appropriate level of complexity for a model, but this rule is basically all
      you need to know. I have had conversations in which people were doubtful that
      anything can be learned from one thousand examples, or that you would ever
      need more than one million examples, because they get stuck in a certain method
      of learning. The key is to scale your learning to the size of your data:</p>
      <ol>
<li>If you are working on a search ranking system, and there are millions
   of different words in the documents and the query and you have 1000
   labeled examples, then you should use a dot product between document
   and query features, <a href="https://en.wikipedia.org/wiki/Tf%E2%80%93idf">TF-IDF</a>,
   and a half_dozen other highly human_engineered
   features. 1000 examples, a dozen features.</li>
<li>If you have a million examples, then intersect the document and query
   feature columns, using regularization and possibly feature selection.
   This will give you millions of features, but with regularization you
   will have fewer. Ten million examples, maybe a hundred thousand features.</li>
<li>If you have billions or hundreds of billions of examples, you can cross
   the feature columns with document and query tokens, using feature selection
   and regularization. You will have a billion examples, and 10 million
   features. Statistical learning theory rarely gives tight bounds, but gives
   great guidance for a starting point.</li>
</ol>
<p>In the end, use
<a href="#" data-path='0:2:1:5'>Rule #28</a> to decide what features to use.</p>
      `},
        {name: 'Rule #22: Clean up features you are no longer using.',
      html: `
      <p>Unused features create technical debt. If you find that you are not using a
feature, and that combining it with other features is not working, then drop
it out of your infrastructure. You want to keep your infrastructure clean so
that the most promising features can be tried as fast as possible. If
necessary, someone can always add back your feature.</p>
<p>Keep coverage in mind when considering what features to add or keep. How many
examples are covered by the feature? For example, if you have some
personalization features, but only 8% of your users have any personalization
features, it is not going to be very effective.</p>
<p>At the same time, some features may punch above their weight. For example, if
you have a feature which covers only 1% of the data, but 90% of the examples
that have the feature are positive, then it will be a great feature to add.</p>
`}
      ]
    }, {
      name: 'Human Analysis of the System',
      html: `<p>Before going on to the third phase of machine learning, it is important to
      focus on something that is not taught in any machine learning class: how to
      look at an existing model, and improve it. This is more of an art than a
      science, and yet there are several anti­patterns that it helps to avoid.</p>`,
      children: [
        {name: 'Rule #23: You are not a typical end user.', 
      html: `<p>This is perhaps the easiest way for a team to get bogged down. While there are
      a lot of benefits to fishfooding (using a prototype within your team) and
      dogfooding (using a prototype within your company), employees should look at
      whether the performance is correct. While a change which is obviously bad
      should not be used, anything that looks reasonably near production should be
      tested further, either by paying laypeople to answer questions on a
      crowdsourcing platform, or through a live experiment on real users.</p>
      <p>There are two reasons for this. The first is that you are too close to the
code. You may be looking for a particular aspect of the posts, or you are
simply too emotionally involved (e.g. confirmation bias). The second is that
your time is too valuable. Consider the cost of nine engineers sitting in a one
hour meeting, and think of how many contracted human labels that buys on a
crowdsourcing platform.</p>
<p>If you really want to have user feedback, <strong>use user experience
methodologies</strong>. Create user personas (one description is in Bill Buxton’s
<a href="https://play.google.com/store/books/details/Bill_Buxton_Sketching_User_Experiences_Getting_the?id=2vfPxocmLh0C">Sketching User Experiences</a>)
early in a process and do usability testing (one
description is in Steve Krug’s
<a href="https://play.google.com/store/books/details/Steve_Krug_Don_t_Make_Me_Think_Revisited?id=QlduAgAAQBAJ">Don’t Make Me Think</a>)
later. User personas
involve creating a hypothetical user. For instance, if your team is all male,
it might help to design a 35-year-old female user persona (complete with user
features), and look at the results it generates rather than 10 results for
25-to-40 year old males. Bringing in actual people to watch their reaction to
your site (locally or remotely) in usability testing can also get you a fresh
perspective.</p>`},
        {name: 'Rule #24: Measure the delta between models.',
      html: `<p>One of the easiest and sometimes most useful measurements you can make before
      any users have looked at your new model is to calculate just how different the
      new results are from production. For instance, if you have a ranking problem,
      run both models on a sample of queries through the entire system, and look at
      the size of the symmetric difference of the results (weighted by ranking
      position). If the difference is very small, then you can tell without running
      an experiment that there will be little change. If the difference is very
      large, then you want to make sure that the change is good. Looking over
      queries where the symmetric difference is high can help you to understand
      qualitatively what the change was like. Make sure, however, that the system is
      stable. Make sure that a model when compared with itself has a low (ideally
      zero) symmetric difference.</p>`},
        {name: 'Rule #25: When choosing models, utilitarian performance trumps predictive power.',
      html: `
      <p>Your model may try to predict click-through rate. However, in the end, the key
question is what you do with that prediction. If you are using it to rank
documents, then the quality of the final ranking matters more than the
prediction itself. If you predict the probability that a document is spam and
then have a cutoff on what is blocked, then the precision of what is allowed
through matters more. Most of the time, these two things should be in
agreement: when they do not agree, it will likely be on a small gain. Thus, if
there is some change that improves log loss but degrades the performance of
the system, look for another feature. When this starts happening more often,
it is time to revisit the objective of your model.</p>`},
        {name: 'Rule #26: Look for patterns in the measured errors, and create new features.',
      html: `
      <p>Suppose that you see a training example that the model got "wrong". In a
classification task, this error could be a false positive or a false negative.
In a ranking task, the error could be a pair where a positive was ranked lower
than a negative. The most important point is that this is an example that the
machine learning system knows it got wrong and would like to fix if given the
opportunity. If you give the model a feature that allows it to fix the error,
the model will try to use it.</p>
<p>On the other hand, if you try to create a feature based upon examples the
system doesn’t see as mistakes, the feature will be ignored. For instance,
suppose that in Play Apps Search, someone searches for "free games". Suppose
one of the top results is a less relevant gag app. So you create a feature for
"gag apps". However, if you are maximizing number of installs, and people
install a gag app when they search for free games, the "gag apps" feature
won’t have the effect you want.</p>
<p>Once you have examples that the model got wrong, look for trends that are
outside your current feature set. For instance, if the system seems to be
demoting longer posts, then add post length. Don’t be too specific about the
features you add. If you are going to add post length, don’t try to guess what
long means, just add a dozen features and the let model figure out what to do
with them (see
<a href="#" data-path='0:2:0:5'>Rule #21</a>
). That is the easiest way to get what you want.</p>`},
        {name: 'Rule #27: Try to quantify observed undesirable behavior.',
      html: `
      <p>Some members of your team will start to be frustrated with properties of the
system they don’t like which aren’t captured by the existing loss function. At
this point, they should do whatever it takes to turn their gripes into solid
numbers. For example, if they think that too many "gag apps" are being shown
in Play Search, they could have human raters identify gag apps. (You can
feasibly use human­labelled data in this case because a relatively small
fraction of the queries account for a large fraction of the traffic.) If your
issues are measurable, then you can start using them as features, objectives,
or metrics. The general rule is "<strong>measure first, optimize second</strong>".</p>`},
        {name: 'Rule #28: Be aware that identical short­term behavior does not imply identical long­term behavior',
      html: `
      <p>Imagine that you have a new system that looks at every doc_id and exact_query,
      and then calculates the probability of click for every doc for every query.
      You find that its behavior is nearly identical to your current system in both
      side by sides and A/B testing, so given its simplicity, you launch it.
      However, you notice that no new apps are being shown. Why? Well, since your
      system only shows a doc based on its own history with that query, there is no
      way to learn that a new doc should be shown.</p>
      <p>The only way to understand how such a system would work long-term is to have
it train only on data acquired when the model was live. This is very
difficult.</p>
      `}
      ]
    }, {
      name: 'Training­-Serving Skew',
      children: [
        {name: 'Rule #29: The best way to make sure that you train like you serve is to save the set of features used at serving time, and then pipe those features to a log to use them at training time.'},
        {name: 'Rule #30: Importance weight sampled data, don’t arbitrarily drop it!'},
        {name: 'Rule #31: Beware that if you join data from a table at training and serving time, the data in the table may change.'},
        {name: 'Rule #32: Re­use code between your training pipeline and your serving pipeline whenever possible.'},
        {name: 'Rule #33: If you produce a model based on the data until January 5th, test the model on the data from January 6th and after.'},
        {name: 'Rule #34: In binary classification for filtering (such as spam detection or determining interesting e­mails), make small short­term sacrifices in performance for very clean data.'},
        {name: 'Rule #35: Beware of the inherent skew in ranking problems.'},
        {name: 'Rule #36: Avoid feedback loops with positional features.'},
        {name: 'Rule #37: Measure Training/Serving Skew.'}
      ]
    }], 
  }, {
    name: 'ML Phase III',
    children: [{
      name: 'Slowed Growth, Optimization Refinement, and Complex Models',
      children: [
        {name: 'Rule #38: Don’t waste time on new features if unaligned objectives have become the issue.'},
        {name: 'Rule #39: Launch decisions will depend upon more than one metric.'},
        {name: 'Rule #40: Keep ensembles simple.'},
        {name: 'Rule #41: When performance plateaus, look for qualitatively new sources of information to add rather than refining existing signals.'},
        {name: 'Rule #42: Don’t expect diversity, personalization, or relevance to be as correlated with popularity as you think they are.'},
        {name: 'Rule #43: Your friends tend to be the same across different products. Your interests tend not to be.'},
      ]
    }]
  }
]}
}