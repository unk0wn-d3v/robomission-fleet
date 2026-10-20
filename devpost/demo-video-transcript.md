# RoboMission Fleet — Demo Video Voiceover Transcript

This transcript is synchronized with the recorded demonstration of **RoboMission Fleet** ([robomission_demo_video_1792497162027.webp](file:///C:/Users/EARTH/.gemini/antigravity-ide/brain/4033babf-d356-4243-9a06-6ed77c70fbb4/robomission_demo_video_1792497162027.webp)). You can read these lines directly as your voiceover track or adapt them in your own voice.

---

## Video Outline & Timestamps

| Scene | Time | Visual Action | Voiceover Cue |
|---|---|---|---|
| **Scene 1** | 0:00 – 0:15 | Console Overview & Architecture | *"Welcome to RoboMission Fleet..."* |
| **Scene 2** | 0:15 – 0:35 | Preset 1: Standard A* Delivery | *"Let’s test a standard mission..."* |
| **Scene 3** | 0:35 – 0:55 | Preset 2: Obstacle Routing | *"Next, we route around static shelves..."* |
| **Scene 4** | 0:55 – 1:25 | **The Climax:** Live Obstacle Detour | *"Here is the climax: dynamic replanning..."* |
| **Scene 5** | 1:25 – 1:55 | Deliberate Failure & Recovery | *"What happens when a goal is trapped?..."* |
| **Scene 6** | 1:55 – 2:15 | Rejection & Clean Reset | *"Finally, out-of-domain rejection & reset..."* |

---

## Full Voiceover Script

### Scene 1: Introduction & Architecture (0:00 – 0:15)
> **[Visual: Camera focuses on the dark industrial console, top control banner, 16x12 warehouse grid, and side telemetry log.]**
>
> *"Welcome to RoboMission Fleet—an interactive 2D warehouse simulator running entirely in the browser. In modern automated fulfillment centers, mobile robots must adapt to unexpected blockages and complex plain-English orders. RoboMission Fleet demonstrates natural language intent parsing, sub-millisecond A-star pathfinding, and dynamic live replanning without continuous physics engines or server dependencies."*

---

### Scene 2: Standard Autonomous Delivery (0:15 – 0:35)
> **[Visual: Cursor clicks '1. Deliver Red Box to Zone A'. Glowing cyan route line renders from Dock to Red Box to Zone A. Blue robot AMR advances tick by tick, docks with Red Box, secures cargo, navigates to Zone A, and unloads it. Explainability log streams live telemetry.]**
>
> *"Let’s run our first mission: 'Pick up the red box and deliver it to Zone A.' Notice how our dual parser immediately structures this command, while our 4-directional Manhattan A-star engine calculates the shortest path in under half a millisecond. As the robot traverses each cell, the cyan path vector trims in real time, secures the cargo at the pickup bay, and unloads it cleanly in Zone A."*

---

### Scene 3: Routing Around Static Obstacles (0:35 – 0:55)
> **[Visual: Cursor clicks '2. Blue Box to Zone B (Avoid Aisle)'. Robot plans path around the central steel storage racks, fetches Blue Box, and transports it to Zone B.]**
>
> *"Next, we test routing around restricted zones: 'Move the blue box to Zone B while avoiding the blocked aisle.' Our A-star engine evaluates the steel racks as impassable obstacles, plotting an optimal detour through the northern corridor. The side explainability log details every decision milestone with timestamped telemetry."*

---

### Scene 4: The Climax — Live Obstacle Drop & Dynamic A* Replanning (0:55 – 1:25)
> **[Visual: Cursor clicks '3. Green Box to Zone A & Return'. While robot moves, user clicks an empty cell directly in its path. An orange hazard barrier drops. Robot instantly pauses, status turns amber 'REPLANNING', new cyan detour vector appears, robot resumes, delivers green crate, and returns to dock.]**
>
> *"Now for the core climax: dynamic live replanning. We launch a multi-leg mission: 'Deliver green box to Zone A, then return to the charging station.' While the robot is traveling, I click directly on an upcoming grid cell. A hazard barrier drops—and watch this: the robot halts immediately, triggers a sub-frame A-star recalculation, plots an adaptive detour around the barrier, and continues seamlessly to deliver the cargo before returning to recharge."*

---

### Scene 5: Deliberate Failure Test & Unblocking Recovery (1:25 – 1:55)
> **[Visual: Cursor clicks '4. Test: Blocked Destination'. Zone A is trapped by 4 hazard barriers. Robot fetches red crate, reaches trapped zone, stops safely with red 'BLOCKED' badge, and logs failure guidance. User clicks one barrier to clear it; robot immediately resumes and finishes.]**
>
> *"Reliable autonomous systems must fail safely. Let's trigger our deliberate failure test: delivery to a completely enclosed bay. When the destination is trapped, the robot doesn't freeze or crash—it safely halts, transitions to BLOCKED, and guides the operator: 'Clear an obstacle or reset the mission.' When I click to clear one barrier, the system detects the reopened corridor and resumes delivery automatically."*

---

### Scene 6: Out-of-Domain Rejection & Clean Reset (1:55 – 2:15)
> **[Visual: User types 'fly to the moon' into the prompt input, clicks 'Run Mission'. Input text is preserved, robot stays idle, error is logged. User clicks 'Reset World'; grid, crates, robot, and telemetry log reset completely to default.]**
>
> *"Finally, we guard against invalid instructions. If someone types 'fly to the moon', our parser rejects the prompt gracefully without inventing tasks, preserving the text so the user can easily retry. Clicking 'Reset World' restores all crates, barriers, and telemetry to pristine factory conditions. That’s RoboMission Fleet: deterministic, adaptive, and explainable."*
