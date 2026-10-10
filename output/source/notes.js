// Speaker notes, one per slide. Running clock assumes a 120-minute session with a 5-minute break after slide 7.
module.exports = [
`SLIDE 1 — YOUR DEGREE IS NOT ENOUGH
DURATION: 5 min (0:00 - 0:05)

SCRIPT:
(Let the slide sit in silence for 3 seconds.)
"Congratulations. You're about to finish, or you already finished, years of hard work. Your degree is real and it matters. But here is the uncomfortable question every graduate faces on day one: So you graduated. Now what?
Today is not a motivational talk. In the next two hours we will look at what employers actually check, learn how engineers really use AI, build a small working product together, live, and leave with a 30-day plan you can start tomorrow."

KEY TEACHING POINTS:
- A degree is the foundation, not the finish line.
- Employers hire for evidence of ability, not just for qualifications.
- This workshop is hands-on: you will build, not just listen.

AUDIENCE INTERACTION:
- Quick poll: "Raise your hand if you have ever been asked in an interview to show something you built." Then: "Keep it up if you had something to show." Use the gap between the two numbers as your hook.

ANIMATION SEQUENCE (automatic on entry):
1. Eyebrow fades in. 2. Headline fades in. 3. Graduation cap and floor glow fade in. 4. The question "So you graduated. Now what?" appears. 5. Logo and handle.`,

`SLIDE 2 — THE REALITY CHECK
DURATION: 9 min (0:05 - 0:14)

SCRIPT:
"University is designed to test what you know. A job is designed to see what you can do with it. Look at the left column: one correct answer, memorizing for exams, individual grades. Now the right: problems with no answer key, learning fast, shipping as a team.
Neither column is wrong. University gives you the theory that makes you a real engineer instead of someone copying tutorials. But the market pays for the right column. Your job for the next two hours is to see how to cross from left to right."
Go row by row; each row appears with its own animation.

KEY TEACHING POINTS:
- The gap is normal. It is not your fault, but it is your responsibility.
- Every row on the right can be practiced while you are still a student.
- Row 4 matters most: a graduation project that lives in a drawer is invisible to employers. The same project on GitHub, with a README and a demo, is evidence.

AUDIENCE INTERACTION:
- Ask the room (on the slide): "Hands up: who has built something that no course required?"
- Ask 2 people who raised their hands: "What did you build and why?" Celebrate it; it is exactly the behavior this workshop is about.
- Follow-up for the rest: "What stopped you?" Typical answers: no time, no idea, don't know where to start. Promise that slides 8 and 11 answer all three.

ANIMATION SEQUENCE (automatic):
Eyebrow, title and subtitle first; then rows 1 to 5 appear one after another (left card, arrow, right card); finally the "Ask the room" bar.`,

`SLIDE 3 — THE SKILLS THAT ACTUALLY GET YOU HIRED
DURATION: 9 min (0:14 - 0:23)

SCRIPT:
"When a company hires a junior engineer, they are betting on six things. Notice that only one of them is 'technical skills'.
Problem-solving: can you break a messy problem into steps you can test?
Communication: can you explain your work to a teammate, a client, a manager?
Practical experience: projects, internships, freelance work. Anything real.
Technical skills: one stack, deep enough to build something end to end. Depth beats a long list of logos on a CV.
Adaptability: tools change every year. Can you learn a new one in a week?
AI literacy: this is new. Companies now expect you to use AI to move faster, and to know when not to trust it."

KEY TEACHING POINTS:
- Employers evaluate skills through evidence: projects, conversations, and how you explain decisions.
- Soft skills are not soft. Communication is often the deciding factor between two similar candidates.
- AI literacy is now a baseline skill, not a bonus.

AUDIENCE INTERACTION / MINI-CHALLENGE (3 min):
- Ask everyone to rate themselves 1 to 5 on each skill, on paper or on their phone.
- "Circle your lowest score. That is your next project." Example: lowest in communication? Your project includes a 2-minute demo video. Lowest in technical skills? Your project goes one layer deeper: tests, authentication, deployment.
- Ask 2 or 3 volunteers to share their lowest skill and one idea to improve it.

ANIMATION SEQUENCE (automatic):
Title, then the 3D brain in the center; then the skills appear in pairs (left and right) with their connector lines; mini-challenge last.`,

`SLIDE 4 — STOP COLLECTING CERTIFICATES. START BUILDING PROOF.
DURATION: 10 min (0:23 - 0:33)

SCRIPT:
"Certificates are not useless. They show you were curious enough to start. But put yourself in the hiring manager's chair: 40 CVs, each with ten online certificates. How do you choose? You can't. A certificate says you attended.
Now look at the right. One public repository. A real local problem: neighborhood generator subscriptions, where the owner tracks who paid this month, often on paper. A clear description, a real stack, steady commit activity, a README with screenshots, a live demo, tests, and a short explanation of the decisions. In 30 seconds a recruiter knows you can build."

KEY TEACHING POINTS:
- Qualification = permission to be considered. Proof = reason to be hired.
- A portfolio project has five parts: a real problem, working code, a README, a live demo, and your decisions explained.
- The best projects come from problems around you: the generator subscription tracker, a clinic queue system, a used-book marketplace for your campus.
- Note: the repository on the slide is an illustrative mockup, not a real account.

AUDIENCE INTERACTION:
- "In 60 seconds, write down one annoying problem you saw this week: at university, at home, in your neighborhood." Collect 3 to 4 answers aloud and turn one into a project title on the spot.

DEMO (optional, 2 min):
- Open a strong real README on GitHub (yours, or a well-known open-source project) and point at: description, screenshots, setup steps, tech stack, and a link to a live demo.

ANIMATION SEQUENCE (automatic):
Title; certificates render; VS badge; repository card; contribution graph; checklist items; captions for certificate and project.`,

`SLIDE 5 — YOUR NEW SUPERPOWER: AI
DURATION: 9 min (0:33 - 0:42)

SCRIPT:
"Treat AI like a brilliant intern: fast, tireless, and sometimes confidently wrong. Good engineers don't ask AI to do the work. They run a loop.
One: YOU frame the problem. Context, constraints, and an example of what good looks like.
Two: AI drafts. Code, schemas, test cases, explanations, alternative approaches.
Three: YOU verify. Run it. Test it. Read every line you are going to ship.
Four: YOU decide. Accept it, edit it, or throw it away. You own the result, not the AI.
Three of the four steps are yours. That is the point."

KEY TEACHING POINTS:
- AI is a collaborator, not an oracle.
- Better context in, better output out. Vague prompts get generic answers.
- Never paste code you can't explain. Never paste secrets (API keys, passwords) into a prompt.
- Use AI to learn faster: ask it to explain, compare, and quiz you, not only to write code.

LIVE DEMO (4 min):
1. Show a short buggy function (for example an average function that crashes on an empty list).
2. Prompt: "Explain why this fails. Don't fix it yet."
3. Prompt: "Now fix it and write a test that would have caught the bug."
4. Run the test. Point out that you verified the fix instead of trusting it.

AUDIENCE INTERACTION:
- "What is the worst AI answer you've ever received?" Take 2 stories. Laugh, then extract the lesson: it sounded confident and it was wrong.

ANIMATION SEQUENCE (automatic):
Title and subtitle; the orb fades in; steps 1 to 4 appear one by one; the demo bar; the four floating capability chips around the orb.`,

`SLIDE 6 — FROM IDEA TO REAL PRODUCT
DURATION: 10 min (0:42 - 0:52)

SCRIPT:
"This is how real software gets built: Idea, Research, Database, Backend, API, UI and UX, and finally a working product. Look at the two rows. The top row is where AI accelerates you: brainstorming, summarizing research, drafting a schema, writing boilerplate and tests, generating API docs, sketching wireframes, preparing deploy scripts.
The bottom row is where human judgment is essential: is this problem worth solving? Which sources are true? What are the keys, relations and constraints? What are the business rules and the security model? What is the API contract? What do users actually need? And the final question only you can answer: is it correct, and is it ready to ship?"

KEY TEACHING POINTS:
- AI drafts. Engineers decide.
- The cost of a wrong decision grows from left to right: a bad database design is cheap to fix on day one and expensive after launch.
- Each step produces an artifact you can show: a problem statement, a schema diagram, an API spec, a wireframe, a deployed URL.

AUDIENCE INTERACTION:
- Ask (on slide): "Which step would you never fully hand to AI? Why?" Take 3 answers. Good answers usually mention database design and security.

DEMO (optional, 3 min):
- Ask an AI assistant to draft a schema for the generator subscription tracker. Point out one decision to question (for example: should payments be a separate table with a month column?).

ANIMATION SEQUENCE (automatic):
Path line wipes in; each stage appears left to right with its "AI assists" chip; then the "You decide" row appears; take-away and question last.`,

`SLIDE 7 — THE MODERN ENGINEER'S TOOLKIT
DURATION: 6 min (0:52 - 0:58), then a 5-minute BREAK (0:58 - 1:03)

SCRIPT:
"You don't need fifty tools. You need one per layer, used well.
Figma to design screens before you code. Claude or ChatGPT to think, plan, explain and review. Cursor, an AI code editor that understands your whole repository. GitHub for version control, collaboration and your public portfolio. FastAPI to build fast, typed Python APIs with automatic documentation. PostgreSQL, the relational database behind countless real products. Supabase, which gives you Postgres with authentication and storage in minutes. Postman to send requests and test your API. Docker to package your app so it runs the same everywhere. And Vercel or Render to put it online with a public link."

KEY TEACHING POINTS:
- Learn the role of each tool, not just its name. In interviews, being able to explain why you chose a tool is worth more than listing it.
- Most of these have free tiers or student plans, so cost is rarely the blocker. Check current terms before relying on them.
- Tools change every year; fundamentals (data modeling, HTTP, testing, Git) don't.

AUDIENCE INTERACTION:
- "Which of these have you used? Hands up per tool." Quickly note the least-used ones; you will use several of them in the live challenge.

BEFORE THE BREAK:
- Announce: "After the break we build something live. Think about which of the three ideas you'd vote for."
- During the break, prepare your machine: editor open, Supabase project ready, Postman open, an AI assistant ready.

ANIMATION SEQUENCE (automatic):
Title; tool tiles appear column by column (top and bottom together); rule of thumb last.`,

`SLIDE 8 — LIVE CHALLENGE: LET'S BUILD SOMETHING
DURATION: 25 min (1:03 - 1:28)

SETUP (prepare before the session):
- A Supabase project (or a local PostgreSQL), a Python environment with FastAPI and Uvicorn, Postman, an AI assistant (Claude, ChatGPT or Cursor), and a blank repository.
- Have a fallback branch with a working version in case the network fails.

STEP 0 — VOTE (1 min): Read the three ideas. Show of hands. Use the winning idea; the slide highlights option A as the example.
Pick 3 volunteers: Driver (types and runs the code), Navigator (writes the prompts), Reviewer (checks every AI output and must say "approved" before anything runs).

STEP 1 — DEFINE (3 min): One user, one problem, three must-have features. Example for A: the generator owner; "I don't know who paid this month"; features: add subscriber, record payment, list unpaid subscribers.
STEP 2 — MODEL (4 min): Ask AI for a schema. Expected: subscribers(id, name, phone, amps, created_at) and payments(id, subscriber_id, month, amount, paid_at). Have the Reviewer check the foreign key and that one subscriber cannot pay the same month twice (unique constraint on subscriber_id + month).
STEP 3 — GENERATE (6 min): Ask AI for FastAPI endpoints: POST /subscribers, GET /subscribers, POST /payments, GET /subscribers/unpaid?month=2026-10. Read the code aloud before running it.
STEP 4 — VERIFY (5 min): Test with Postman or the automatic /docs page. Deliberately try a duplicate payment or a missing subscriber. Find and fix at least one real bug. This is the most important step: celebrate the bug.
STEP 5 — INTERFACE (4 min): Ask AI for one simple HTML page (or a v0 / Cursor-generated component) that lists subscribers and marks them as paid.
STEP 6 — DEMO (3 min): Run it end to end. Ask the room: "What would you add next?" (SMS reminders, monthly report, login for the owner.)

EXPECTED OUTPUT:
2 database tables, 4 API endpoints, 1 working web page, 1 README with a screenshot, built and verified in 25 minutes.

KEY TEACHING POINTS:
- Speed comes from AI; correctness comes from the process.
- The Reviewer role is the job of an engineer.
- Small and working beats big and broken.

ANIMATION SEQUENCE (automatic):
Live badge; vote cards; volunteer roles; steps 1 to 6 appear one by one; expected output panel last.`,

`SLIDE 9 — THINK LIKE AN ENGINEER, NOT A PROMPT WRITER
DURATION: 10 min (1:28 - 1:38)

SCRIPT:
"This code was generated in four seconds. It runs. It even returns the right user. Would you ship it?
60-second challenge: find the bugs before I reveal them." (Click to reveal the findings and markers.)
"One: SQL injection. The user's input is pasted straight into the SQL string; someone can send a crafted id and read or delete your data. Use parameterized queries or an ORM.
Two: no authentication. Anyone who guesses an id can read any user.
Three: it returns the whole row, including the password hash and private fields. Return only what the client needs.
Four: when the user doesn't exist, it returns null instead of a clear 404 error.
A prompt writer says 'it runs, ship it'. An engineer says 'it runs; now prove it's right'."

KEY TEACHING POINTS (the engineer's review):
- Architecture: does it fit the structure of the project, or is it a one-off hack?
- Logic: what happens with empty, missing or weird input?
- Security: can a user see or change data that isn't theirs?
- Usability: will a real user understand what went wrong?
- Correctness: which test proves it works, and did you run it?

AUDIENCE INTERACTION:
- The 60-second bug hunt. Students call out bugs; award applause for each one found before the reveal.
- Then ask: "How would you ask the AI to fix all four in one prompt?" Write the prompt together, including the request for tests.

ANIMATION SEQUENCE:
Code window and checklist appear automatically. The bug markers and the Review Findings list appear ON CLICK, after the 60-second challenge. Verdict line last.`,

`SLIDE 10 — HOW TO ACTUALLY GET YOUR FIRST TECHNICAL JOB
DURATION: 10 min (1:38 - 1:48)

SCRIPT:
"Here is the path from student to hired, in eight steps. The top row is what you build, the bottom row is how you get seen.
1 GitHub: a clean profile, with 3 pinned repositories that have real READMEs.
2 Portfolio: 2 or 3 projects that solve real problems. Quality over quantity.
3 CV: one page. Projects first. Every link works. Describe impact, not duties.
4 LinkedIn: a clear headline, like 'Backend developer, Python and PostgreSQL'. Share what you build, weekly.
5 Networking: meetups, hackathons, online communities. Help others first; people remember who helped them.
6 Internships: apply early. Small startups count, and often teach you more.
7 Interviews: practice explaining your own project's decisions out loud. Why this database? What would you change?
8 Applications: tailor each one, track them in a simple sheet, and follow up after a week."

KEY TEACHING POINTS:
- Remote and international roles exist, but competition is global. Strong English communication and visible work are what make you competitive. Nothing is guaranteed; consistency wins.
- Rejection is data, not a verdict. Track why you were rejected and improve one thing each time.

AUDIENCE INTERACTION:
- "Which step are you on right now?" Ask people to hold up fingers 1 to 8. Most rooms cluster at 1 or 2; that is fine. Tell them the 30-day plan on the next slide moves them to step 4.
- Mini role-play (2 min): one volunteer explains a project in 30 seconds as if in an interview; the room gives one piece of feedback.

ANIMATION SEQUENCE (automatic):
The path draws in, then milestones 1 to 8 appear in order along the path; the final milestone (Applications) glows coral.`,

`SLIDE 11 — YOUR NEXT 30 DAYS
DURATION: 6 min (1:48 - 1:54)

SCRIPT:
"Take out your phone. Screenshot this slide. This is your plan for the next 30 days.
Week 1, PICK: choose one real problem around you and one stack. Create the repository and write the README plan before you write code.
Week 2, BUILD: design the database, build three or four API endpoints, and commit every day you code.
Week 3, SHIP: add a simple interface, test the core logic, deploy it with a public link.
Week 4, SHOW: polish the README with screenshots, post a short demo video, and apply to five roles or internships with this project.
Daily minimum: one focused hour. Not five hours on Friday. One hour, every day."

KEY TEACHING POINTS:
- Consistency beats intensity.
- Scope small. A finished small project is worth more than an unfinished big one.
- Building in public creates accountability and visibility at the same time.

AUDIENCE INTERACTION:
- Pair up (2 min): tell your neighbor your Week 1 problem and agree to check on each other in 7 days.
- Invite them to share progress and tag @skillture.iq so the community can follow and support.

ANIMATION SEQUENCE (automatic):
"Screenshot this" badge; weeks 1 to 4 appear left to right; daily minimum line last.`,

`SLIDE 12 — YOUR FUTURE IS WHAT YOU BUILD
DURATION: 6 min including Q&A (1:54 - 2:00)

SCRIPT:
(Slow down. Lower your voice.)
"Your degree is what you earned." (Pause 2 seconds.)
"Your future is what you build."
"Three actions. Tonight: create your GitHub repository; it takes five minutes. This week: pick your real problem. In 30 days: ship it, and share it. I would love to see what you build.
Thank you. Let's take your questions."

KEY TEACHING POINTS:
- Close on action, not inspiration: three concrete next steps with deadlines.
- Make it easy to stay connected: @skillture.iq.

Q&A TIPS:
- Repeat each question so the whole room hears it.
- If a question is very personal (a specific CV or project), invite the person to talk after the session.
- Have 2 backup questions ready in case the room is quiet: "Which tool should I learn first?" and "Can I get a remote job as a fresh graduate?"

ANIMATION SEQUENCE (automatic):
First line fades in; pause; "Your future is what you build." appears; the 3D building blocks appear; the three action cards; logo and Q&A line last.`,
];
