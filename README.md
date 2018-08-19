# Gongle

Gongle is a community forum created with PugJS, jQuery, Sass, Node.js, and PostgreSQL. The forum has categories and in each category are topics. In each topics are subtopics where users can create posts. All replies inside a post must be a reply to another post, meaning that a quote of the post being replied to will be included in the user's reply post. Replies are sorted chronologically, however there are plans to implement a filter to sort by highest votes.

## Features

### Upvote/Downvote

Users can upvote and downvote posts. A table tracks user votes to ensure that users cannot vote more than once.

### Following Posts

Users can follow a post by clicking on the star button at the top right of a post. Followed posts are listed in the user profile. However, there are plans to list them in the forum for quick access.

### Notifications

User will receive notifications when their post has a reply. A counter will display the number of new notifications in the user panel. Users can also view all their notifications in their profile.

### User Profile

#### Stats

The stats tab shows the total number of upvote and downvote that the user has received, total honor received (to be implemented), and total posts. There is also a chart that shows the user's post frequency for the current month and can be filtered by different months.

At the bottom of the tab is a list of violation issued to the user by the mods/admins. It is not visible to the public.

#### Posts, Replies, Followed Posts

These tracks the users activity regarding forum posts and replies. It is not visible to the public.

#### Friends

The user's friends list. It will show the users' online statuses even if they set their online status to hidden in their account settings.

### Account Settings

#### Hide Email, Hide Online Status

Hides the specified info from public. Hiding online status will not hide it from the user's friends.

#### Email Notifications

Enable/disable email notifications from the system such as violations being issued, bans, etc.

#### Change Password/Email

Self-explanatory

### Messaging

A simple messaging system. The interface features organization of messages into inbox, outbox, and saved messages. Users can also report a message and the message content will be sent to the report table. The icon in the user panel will show the number of unread messages.

### Moderators

#### Closing and Removing Post

Moderators can close posts, which will stop users from being able to reply to the post. Removing posts removes it from the forum but not the database.

#### Issue Violation

Issues a violation to the user. In the event if the moderator tries to issue a violation to a user with moderator or higher privilege, it will return a message indicating that it is now allowed.

#### Temporary and Permanent Ban

At the moment, they are basically the same thing with different names to distinguish the bans. Future plan for temporary ban is an automatic remove of the ban status when the ban phase is over and setting a duration of the temporary ban. To unban a user, moderators have to manually select "Activate User".

### Administrators

Administrators have access to the admin panel that manages the entire forum.

#### Overview

The overview page shows the status of each category, such as open, close, or removed. Nested in the categories is the number of posts in each subtopics.

#### Users

The user section shows all the users and their details in a collapsable div. Here, admin can ban, remove, and promote users as they wish.

#### Posts

The posts section allow admins to search for posts. Here, admins are also allow to close and remove posts. Clicking on the post links to the details of the post, showing all the replies in case the admin wants to review a post.

#### Categories

A list of all the categories in the forum. Admin can rename categories, add more categories as they wish, or delete them from the database. The newly added categories will not have a unique icon to it. There are plans to allow admins to pick the icons they wish to use. This would require an integration of all the free FontAwesome icons into the sytem for the admin to pick. Changing the status of a category will change its children topics and subtopics statuses as well.

#### Forums

This section allows the search of topics and subtopics. After getting the results, admin can move the topics to a different category or move a subtopic to a different topic. They can also rename, close, and remove them, or create new ones.

#### Site

This is the site configuration page where admin can close down the forum or shut off registrations.

#### Reports

The reports section shows all the reports made by users. Only one report can be made per post or message as there is a unique constraint in the database to prevent duplicate reports. Admin will review the report by going to the link and see what is being reported. If activities that violates the terms of service or anything that the admin feels it's worth disciplining, they will issue a violation to the user. After the report has been reviewed, the admin will click the check button and write a short report as to what happened and how it is handled. Afterwards, the status of the report will change to "Reviewed".

## Third-party Libraries Used

[Quill WYSIWYG Editor](https://github.com/quilljs/quill)

[Chart.js](https://www.chartjs.org/)