# Portfolio Project Description

## FestNest

FestNest is a mobile app concept I created for coordinating camping music festival trips with a group. The goal was to make the messy parts of festival planning easier to manage in one place: who is coming, how people are getting there, what supplies are covered, what meals are planned, what artists the group wants to see, how shared costs get split, and what emergency information is available if something goes wrong.

I owned the original idea, the product plan, and the system design. Most of the implementation was completed with coding agents, but I stayed responsible for the architecture, the quality bar, and the debugging. In practice, that meant defining the modules, data model, permissions, and sync behavior up front, then reviewing generated code, finding weak spots, and tightening the parts that had to be reliable.

The app is built with React Native and Expo on the client, with Supabase handling authentication, relational data, row-level security, and realtime collaboration. Several parts of the app also use local SQLite storage so they can keep working when connectivity is poor, which matters for a festival setting. The most important offline-capable pieces are the camp layout planner, the safety profile system, and the packing checklist.

One of the more technical parts of the project is the camp grid. Users can lay out tents, canopies, tables, vehicles, and custom items on a campsite grid, save the layout locally, and push a shared version to the group backend. I also spent time hardening the save flow so a failed remote load would not accidentally overwrite or delete shared data.

Another important area is the safety system. Safety profiles are encrypted locally, with device-stored keys, then cached for offline access. I also added emergency PIN handling and worked through edge cases around missing local rows, stale cached data, and rehydrating newer encrypted data from the backend when needed.

The backend is functional and supports working authentication, share links for group invites, shared trip state, and live updates in several modules. The project is still in progress, and some surfaces are scaffolded or only partially finished, but the core architecture and many end-to-end flows are already working.

This project is a strong example of how I work when I am defining a system from scratch: I start with product structure and state design, use AI tools aggressively for leverage, and spend most of my attention on making the real behavior coherent, testable, and reliable.

## Short Version

FestNest is an agent-assisted full-stack mobile app I designed for coordinating group camping festival trips. It combines React Native, Supabase, realtime collaboration, offline SQLite modules, and encrypted safety data in a shared-state planning system that I planned, reviewed, and hardened end to end.
