--
-- PostgreSQL database dump
--

-- Dumped from database version 10.1
-- Dumped by pg_dump version 10.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- Name: check_id_exists(character varying, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION check_id_exists(col character varying, val integer, uid integer) RETURNS void
    LANGUAGE plpgsql
    AS $_$
declare
result int[];
begin
execute format('SELECT %I FROM users WHERE user_id = $1 AND $I @> ''{$2}''::int[]', col, col) USING uid, val INTO result;
end
$_$;


ALTER FUNCTION public.check_id_exists(col character varying, val integer, uid integer) OWNER TO postgres;

--
-- Name: is_mod_admin(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION is_mod_admin(integer) RETURNS boolean
    LANGUAGE sql
    AS $_$
select exists (select 1 from users where user_id = $1 and privilege > 0);
$_$;


ALTER FUNCTION public.is_mod_admin(integer) OWNER TO postgres;

--
-- Name: post_reply(character varying, character varying, integer, text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION post_reply(title character varying, puser character varying, topic integer, body text, reply_to integer, belongs_to integer) RETURNS void
    LANGUAGE plpgsql
    AS $_$
DECLARE belongs_to_id INTEGER;
DECLARE reply_to_id INTEGER;
BEGIN
INSERT INTO posts (post_title, post_user, post_topic, post_body, reply_to_post_id, belongs_to_post_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING belongs_to_post_id, reply_to_post_id INTO belongs_to_id, reply_to_id;
IF belongs_to_id IS NOT NULL THEN IF belongs_to_id = reply_to_id THEN UPDATE posts SET replies = replies + 1 WHERE post_id = belongs_to_id; ELSEIF belongs_to_id != reply_to_id THEN UPDATE posts SET replies = replies + 1 WHERE post_id IN (belongs_to_id, reply_to_id);
END IF;
END IF;
END
$_$;


ALTER FUNCTION public.post_reply(title character varying, puser character varying, topic integer, body text, reply_to integer, belongs_to integer) OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE categories (
    cat_id integer NOT NULL,
    category character varying,
    cat_created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cat_created_by character varying,
    cat_status character varying DEFAULT 'Open'::character varying,
    CONSTRAINT check_cat_status CHECK (((cat_status)::text = ANY ((ARRAY['Open'::character varying, 'Closed'::character varying, 'Removed'::character varying])::text[])))
);


ALTER TABLE categories OWNER TO postgres;

--
-- Name: category_cat_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE category_cat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE category_cat_id_seq OWNER TO postgres;

--
-- Name: category_cat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE category_cat_id_seq OWNED BY categories.cat_id;


--
-- Name: config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE config (
    config_id integer NOT NULL,
    config_name character varying,
    status character varying DEFAULT 'Open'::character varying
);


ALTER TABLE config OWNER TO postgres;

--
-- Name: config_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE config_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE config_config_id_seq OWNER TO postgres;

--
-- Name: config_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE config_config_id_seq OWNED BY config.config_id;


--
-- Name: followed_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE followed_posts (
    followed_id integer NOT NULL,
    followed_post integer,
    followed_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_following character varying NOT NULL
);


ALTER TABLE followed_posts OWNER TO postgres;

--
-- Name: followed_posts_followed_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE followed_posts_followed_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE followed_posts_followed_id_seq OWNER TO postgres;

--
-- Name: followed_posts_followed_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE followed_posts_followed_id_seq OWNED BY followed_posts.followed_id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE messages (
    message_id integer NOT NULL,
    sender character varying NOT NULL,
    recipient character varying NOT NULL,
    message_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    message text,
    message_status character varying DEFAULT 'Unread'::character varying NOT NULL,
    message_saved_status boolean DEFAULT false
);


ALTER TABLE messages OWNER TO postgres;

--
-- Name: messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE messages_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE messages_message_id_seq OWNER TO postgres;

--
-- Name: messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE messages_message_id_seq OWNED BY messages.message_id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE posts (
    post_id integer NOT NULL,
    post_title character varying NOT NULL,
    post_user character varying(50) NOT NULL,
    post_created timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    post_modified timestamp without time zone,
    post_topic integer NOT NULL,
    post_status character varying DEFAULT 'Open'::character varying,
    post_body text NOT NULL,
    post_upvote integer DEFAULT 0 NOT NULL,
    post_downvote integer DEFAULT 0 NOT NULL,
    reply_to_post_id integer,
    belongs_to_post_id integer,
    replies integer DEFAULT 0 NOT NULL,
    CONSTRAINT check_post_status CHECK (((post_status)::text = ANY ((ARRAY['Open'::character varying, 'Closed'::character varying, 'Removed'::character varying])::text[])))
);


ALTER TABLE posts OWNER TO postgres;

--
-- Name: posts_post_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE posts_post_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE posts_post_id_seq OWNER TO postgres;

--
-- Name: posts_post_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE posts_post_id_seq OWNED BY posts.post_id;


--
-- Name: replies; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW replies AS
 SELECT row_number() OVER (ORDER BY posts.post_id) AS row_number,
    posts.post_id,
    posts.post_title
   FROM posts
  WHERE (posts.belongs_to_post_id = 1);


ALTER TABLE replies OWNER TO postgres;

--
-- Name: subtopics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE subtopics (
    subtopic_id integer NOT NULL,
    subtopic_title character varying NOT NULL,
    subtopic_created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    belongs_to_topic integer NOT NULL,
    subtopic_status character varying DEFAULT 'Open'::character varying,
    subtopic_created_by character varying,
    CONSTRAINT check_subtopic_status CHECK (((subtopic_status)::text = ANY ((ARRAY['Open'::character varying, 'Closed'::character varying, 'Removed'::character varying])::text[])))
);


ALTER TABLE subtopics OWNER TO postgres;

--
-- Name: subtopics_subtopic_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE subtopics_subtopic_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE subtopics_subtopic_id_seq OWNER TO postgres;

--
-- Name: subtopics_subtopic_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE subtopics_subtopic_id_seq OWNED BY subtopics.subtopic_id;


--
-- Name: topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE topics (
    topic_id integer NOT NULL,
    topic_title character varying NOT NULL,
    topic_created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    topic_category integer NOT NULL,
    topic_created_by character varying,
    topic_status character varying DEFAULT 'Open'::character varying
);


ALTER TABLE topics OWNER TO postgres;

--
-- Name: topics_topic_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE topics_topic_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE topics_topic_id_seq OWNER TO postgres;

--
-- Name: topics_topic_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE topics_topic_id_seq OWNED BY topics.topic_id;


--
-- Name: user_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE user_reports (
    r_id integer NOT NULL,
    reported_id integer NOT NULL,
    reported_by character varying NOT NULL,
    reported_type character varying NOT NULL,
    reported_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    report_action character varying DEFAULT 'Pending'::character varying NOT NULL
);


ALTER TABLE user_reports OWNER TO postgres;

--
-- Name: user_reports_r_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE user_reports_r_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE user_reports_r_id_seq OWNER TO postgres;

--
-- Name: user_reports_r_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE user_reports_r_id_seq OWNED BY user_reports.r_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE users (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying NOT NULL,
    email character varying(100) NOT NULL,
    last_login timestamp without time zone,
    privilege integer DEFAULT 0 NOT NULL,
    user_status character varying DEFAULT 'Pending'::character varying,
    user_level character varying DEFAULT 'Newcomer'::character varying NOT NULL,
    receive_email boolean DEFAULT true,
    show_online boolean DEFAULT true,
    avatar_url character varying DEFAULT '/images/profile_default.png'::character varying,
    user_created timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_confirmed timestamp without time zone,
    hide_email boolean DEFAULT false,
    online_status character varying DEFAULT 'Offline'::character varying,
    CONSTRAINT check_online_status CHECK (((online_status)::text = ANY ((ARRAY['Offline'::character varying, 'Online'::character varying])::text[]))),
    CONSTRAINT check_privilege CHECK ((privilege = ANY (ARRAY[0, 1, 2, 3]))),
    CONSTRAINT check_status CHECK (((user_status)::text = ANY ((ARRAY['Active'::character varying, 'Banned'::character varying, 'Deleted'::character varying, 'Pending'::character varying, 'Suspended'::character varying])::text[]))),
    CONSTRAINT check_user_level CHECK (((user_level)::text = ANY ((ARRAY['Newcomer'::character varying, 'Regular'::character varying, 'Contributor'::character varying, 'Administrator'::character varying, 'Moderator'::character varying, 'Owner'::character varying, 'Unreliable'::character varying])::text[])))
);


ALTER TABLE users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE users_user_id_seq OWNED BY users.user_id;


--
-- Name: violations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE violations (
    v_id integer NOT NULL,
    v_user_id integer,
    violation text,
    v_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    v_issued_by integer,
    CONSTRAINT chk_if_mod_or_admin CHECK (is_mod_admin(v_issued_by))
);


ALTER TABLE violations OWNER TO postgres;

--
-- Name: violations_v_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE violations_v_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE violations_v_id_seq OWNER TO postgres;

--
-- Name: violations_v_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE violations_v_id_seq OWNED BY violations.v_id;


--
-- Name: vote_tracking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE vote_tracking (
    voting_user_id integer,
    voting_post_id integer,
    vote character varying
);


ALTER TABLE vote_tracking OWNER TO postgres;

--
-- Name: categories cat_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY categories ALTER COLUMN cat_id SET DEFAULT nextval('category_cat_id_seq'::regclass);


--
-- Name: config config_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY config ALTER COLUMN config_id SET DEFAULT nextval('config_config_id_seq'::regclass);


--
-- Name: followed_posts followed_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY followed_posts ALTER COLUMN followed_id SET DEFAULT nextval('followed_posts_followed_id_seq'::regclass);


--
-- Name: messages message_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY messages ALTER COLUMN message_id SET DEFAULT nextval('messages_message_id_seq'::regclass);


--
-- Name: posts post_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY posts ALTER COLUMN post_id SET DEFAULT nextval('posts_post_id_seq'::regclass);


--
-- Name: subtopics subtopic_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY subtopics ALTER COLUMN subtopic_id SET DEFAULT nextval('subtopics_subtopic_id_seq'::regclass);


--
-- Name: topics topic_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY topics ALTER COLUMN topic_id SET DEFAULT nextval('topics_topic_id_seq'::regclass);


--
-- Name: user_reports r_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_reports ALTER COLUMN r_id SET DEFAULT nextval('user_reports_r_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users ALTER COLUMN user_id SET DEFAULT nextval('users_user_id_seq'::regclass);


--
-- Name: violations v_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY violations ALTER COLUMN v_id SET DEFAULT nextval('violations_v_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY categories (cat_id, category, cat_created_on, cat_created_by, cat_status) FROM stdin;
1	Health	2018-06-10 18:43:58.64452	rogerchin85	Open
5	Fitness	2018-06-10 20:32:01.812118	rogerchin85	Open
3	Entertainment	2018-06-10 20:30:25.023665	rogerchin85	Open
4	Sports	2018-06-10 20:31:47.647811	rogerchin85	Open
6	Computers	2018-06-15 01:37:00.504568	rogerchin85	Open
7	Electronics	2018-06-23 06:28:24.104601	rogerchin85	Open
2	Automotives	2018-06-10 19:36:31.564292	rogerchin85	Open
8	Fashion	2018-06-23 06:57:16.864407	rogerchin85	Open
9	Intellectual	2018-06-23 07:35:39.622054	rogerchin85	Open
10	Miscellaneous	2018-06-23 07:35:45.300872	rogerchin85	Open
\.


--
-- Data for Name: config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY config (config_id, config_name, status) FROM stdin;
1	Registration	Open
2	Site	Open
\.


--
-- Data for Name: followed_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY followed_posts (followed_id, followed_post, followed_on, user_following) FROM stdin;
1	1	2018-06-24 17:00:27.805	testuser2
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY messages (message_id, sender, recipient, message_date, message, message_status, message_saved_status) FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY posts (post_id, post_title, post_user, post_created, post_modified, post_topic, post_status, post_body, post_upvote, post_downvote, reply_to_post_id, belongs_to_post_id, replies) FROM stdin;
1	My chest is fucking hairy	rogerchin85	2018-05-25 05:38:13.736038	2018-06-09 19:37:49.769	22	Open	Are there permanent hair removal?\r\n\r\nWill pay someone to help me remove my chest hair permanently. Offering $1,000.\r\n\r\nEdit - $2,000 now\r\n\r\nEdit - $,3000 now!\r\n\r\nEdit - $4,000 now!\r\n\r\nEdit - $5,000!\r\n\r\nEdit - $6,000!	3	-1	\N	\N	3
2	RE: My chest is fucking hairy	testuser	2018-05-25 05:38:49.805255	2018-05-25 10:28:41.964	22	Removed	Haha, your dad fucked an ape and gave birth to you.\r\n\r\nEdit - I apologize.	1	-3	1	1	0
18	I'm losing a lot of hair, fast	rogerchin85	2018-05-29 11:07:30.243947	\N	2	Open	Help me please!	4	0	\N	\N	0
19	I need a way to enlarge my penis	rogerchin85	2018-05-29 11:08:06.979974	\N	41	Open	Help please	1	-2	\N	\N	0
17	My penis is too big	rogerchin85	2018-05-27 17:17:20.459765	\N	41	Open	I need a way to shrink it. Anyone know a way?	1	-2	\N	\N	0
3	RE: My chest is fucking hairy	testuser	2018-05-25 05:39:22.293655	\N	22	Open	I apologize, that was kinda rude.	3	-1	1	1	1
40	post #7	rogerchin85	2018-06-20 18:22:48.885639	\N	22	Open	this is a test	0	0	\N	\N	0
41	post #8	rogerchin85	2018-06-20 18:22:57.620158	\N	22	Open	this is a test	0	0	\N	\N	0
42	post #9	rogerchin85	2018-06-20 18:23:10.319848	\N	22	Open	this is a test	0	0	\N	\N	0
33	My chest is fucking hairy	niceuser	2018-06-18 19:02:56.664325	\N	22	Open	Posting again to test the back link	0	0	1	1	0
43	My chest is fucking hairy	niceuser	2018-06-23 04:48:00.963415	\N	22	Open	test	0	0	1	1	0
4	RE: My chest is fucking hairy	rogerchin85	2018-05-25 05:39:51.511191	\N	22	Open	Lorem ipsum dolor sit amet consectetur adipisicing elit. Mollitia, aperiam nihil. Laborum soluta molestias maiores non! Pariatur iste maxime maiores reprehenderit modi quia quo officia! Vero consequuntur praesentium necessitatibus recusandae?\n                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Illum quia ipsa labore voluptate, magni quidem unde consequatur? Commodi deserunt provident sint eos ipsum perspiciatis, cupiditate placeat nam? Earum, sed fuga?	3	0	3	1	0
44	My chest is fucking hairy	niceuser	2018-06-23 04:48:11.691564	\N	22	Open	testing pagination!	0	0	1	1	0
45	My chest is fucking hairy	niceuser	2018-06-23 04:48:24.150522	\N	22	Open	need more replies!	0	0	1	1	0
21	My chest hurts	rogerchin85	2018-06-10 19:09:37.647915	\N	22	Open	help me please, it's hurting a lot.	2	0	\N	\N	0
30	2018 Honda Accord Spec	testuser	2018-06-17 20:45:39.839512	\N	49	Open	What is the spec of the new Honda Accord?	1	0	\N	\N	0
23	2018 Honda Accord	rogerchin85	2018-06-14 22:23:21.352413	\N	49	Open	The new Honda Accord is sick, especially the turbo charged one. Can't believe it beats the 2017 v6 in a drag race.	1	0	\N	\N	0
31	My chest is fucking hairy	niceuser	2018-06-18 18:58:30.084233	\N	22	Open	It's okay, everyone is different. Some people actually find body hair as being masculine.	0	0	1	1	0
32	My chest is fucking hairy	niceuser	2018-06-18 19:00:17.791328	\N	22	Open	But to answer your question, there is no permanent solution to removing body hair.	0	0	1	1	0
34	post #1	rogerchin85	2018-06-20 18:19:10.145006	\N	22	Open	this is a test	0	0	\N	\N	0
35	post #2	rogerchin85	2018-06-20 18:19:18.900874	\N	22	Open	this is a test	0	0	\N	\N	0
36	post #3	rogerchin85	2018-06-20 18:19:26.628848	\N	22	Open	this is a test	0	0	\N	\N	0
37	post #4	rogerchin85	2018-06-20 18:21:04.84707	\N	22	Open	this is a test	0	0	\N	\N	0
38	post #5	rogerchin85	2018-06-20 18:21:11.738902	\N	22	Open	this is a test	0	0	\N	\N	0
39	post #6	rogerchin85	2018-06-20 18:22:35.202979	\N	22	Open	this is a test	0	0	\N	\N	0
46	My chest is fucking hairy	niceuser	2018-06-23 04:48:37.07909	\N	22	Open	2 more to go	0	0	1	1	0
47	My chest is fucking hairy	niceuser	2018-06-23 04:48:42.842566	\N	22	Open	1 more to go	0	0	1	1	0
48	My chest is fucking hairy	niceuser	2018-06-23 04:48:50.218432	\N	22	Open	this should be on second page	1	0	1	1	0
49	I'm losing a lot of hair, fast	niceuser	2018-06-23 04:58:21.65659	\N	2	Open	It's not curable	0	0	18	18	0
51	hyundai price	testuser	2018-06-24 00:28:40.228254	\N	97	Open	replying to see if this increments the replies column	0	0	50	50	0
50	hyundai price	rogerchin85	2018-06-24 00:15:49.887056	\N	97	Open	why are they so cheap???	0	0	\N	\N	2
53	hyundai price	rogerchin85	2018-06-24 00:30:24.055695	\N	97	Open	post #52 should have 1 reply	0	0	52	52	0
52	hyundai price	testuser	2018-06-24 00:29:48.370944	\N	97	Open	replying again and replies should be at 2 now	0	0	50	50	1
54	android is the best	rogerchin85	2018-06-24 01:46:40.360021	\N	157	Open	because it's cheap hahahaha	0	0	\N	\N	0
55	Can i post here?	testuser2	2018-06-27 18:55:27.540144	\N	90	Open	does this work or not?	0	0	\N	\N	0
56	can i post?	testuser2	2018-06-27 19:00:51.748872	\N	144	Open	I am temporary banned	0	0	\N	\N	0
57	trying again	testuser2	2018-06-27 19:02:10.512727	\N	144	Open	Added condition to posting	0	0	\N	\N	0
\.


--
-- Data for Name: subtopics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY subtopics (subtopic_id, subtopic_title, subtopic_created_on, belongs_to_topic, subtopic_status, subtopic_created_by) FROM stdin;
1	Scalp	2018-05-16 03:36:19.730784	1	Open	rogerchin85
21	Toe	2018-05-16 16:57:39.68139	2	Open	rogerchin85
67	Dodge	2018-06-11 02:14:07.993889	42	Open	rogerchin85
68	GMC	2018-06-11 02:21:40.252968	42	Open	rogerchin85
5	Nose	2018-05-16 03:36:19.730784	1	Open	rogerchin85
69	Chevrolet	2018-06-11 02:22:21.823055	42	Open	rogerchin85
7	Neck	2018-05-16 03:36:19.730784	1	Open	rogerchin85
8	Face	2018-05-16 03:36:19.730784	1	Open	rogerchin85
9	Shoulder	2018-05-16 16:57:39.68139	2	Open	rogerchin85
45	Buttock	2018-05-16 17:06:31.758468	3	Open	rogerchin85
47	Nipple	2018-05-16 17:06:31.758468	3	Open	rogerchin85
12	Forearm	2018-05-16 16:57:39.68139	2	Open	rogerchin85
13	Wrist	2018-05-16 16:57:39.68139	2	Open	rogerchin85
25	Rib	2018-05-16 17:04:03.443576	3	Open	rogerchin85
46	Breast	2018-05-16 17:06:31.758468	5	Open	rogerchin85
43	Testicle	2018-05-16 17:06:31.758468	5	Open	rogerchin85
17	Knee	2018-05-16 16:57:39.68139	2	Open	rogerchin85
18	Calves	2018-05-16 16:57:39.68139	2	Open	rogerchin85
3	Ear	2018-05-16 03:36:19.730784	1	Closed	rogerchin85
4	Eye	2018-05-16 03:36:19.730784	1	Open	rogerchin85
89	Automotive General	2018-06-17 14:40:05.663883	68	Open	rogerchin85
70	Cadillac	2018-06-11 02:25:07.402662	42	Open	rogerchin85
23	Stomach	2018-05-16 17:04:03.443576	3	Open	rogerchin85
71	Jeep	2018-06-11 02:26:34.980745	42	Open	rogerchin85
26	Waist	2018-05-16 17:04:03.443576	3	Open	rogerchin85
27	Hips	2018-05-16 17:04:03.443576	3	Open	rogerchin85
28	Groin	2018-05-16 17:04:03.443576	3	Open	rogerchin85
29	Brain	2018-05-16 17:04:03.443576	4	Open	rogerchin85
30	Heart	2018-05-16 17:04:03.443576	4	Open	rogerchin85
91	Entertainment General	2018-06-17 14:41:58.275618	70	Open	rogerchin85
32	Liver	2018-05-16 17:04:03.443576	4	Open	rogerchin85
33	Bladder	2018-05-16 17:04:03.443576	4	Open	rogerchin85
34	Kidney	2018-05-16 17:04:03.443576	4	Open	rogerchin85
36	Thyroid	2018-05-16 17:04:03.443576	4	Open	rogerchin85
37	Spleen	2018-05-16 17:04:03.443576	4	Open	rogerchin85
38	Pancrea	2018-05-16 17:04:03.443576	4	Open	rogerchin85
39	Prostate	2018-05-16 17:04:03.443576	4	Open	rogerchin85
40	Skin	2018-05-16 17:04:03.443576	4	Open	rogerchin85
41	Penis	2018-05-16 17:06:31.758468	5	Open	rogerchin85
72	Buick	2018-06-11 02:28:29.509505	42	Open	rogerchin85
35	Intestine	2018-05-16 17:04:03.443576	4	Open	rogerchin85
31	Lung	2018-05-16 17:04:03.443576	4	Open	rogerchin85
93	Fitness General	2018-06-17 14:44:27.574574	69	Open	rogerchin85
44	Rectum	2018-05-16 17:06:31.758468	3	Open	rogerchin85
94	Health General	2018-06-17 14:44:44.638137	66	Open	rogerchin85
48	Spine	2018-06-02 15:47:10.003907	3	Open	rogerchin85
2	Hair	2018-05-16 03:36:19.730784	1	Open	rogerchin85
6	Mouth	2018-05-16 03:36:19.730784	3	Open	rogerchin85
73	Lincoln	2018-06-11 02:30:48.416161	42	Open	rogerchin85
74	Tesla	2018-06-11 02:32:05.209721	42	Open	rogerchin85
57	Audi	2018-06-10 22:37:21.252998	41	Open	rogerchin85
22	Chest	2018-05-16 17:04:03.443576	3	Open	rogerchin85
95	Sports General	2018-06-17 14:44:54.46802	71	Open	rogerchin85
75	Mercerdes	2018-06-11 02:32:50.559887	41	Open	rogerchin85
76	BMW	2018-06-11 02:32:53.709386	41	Open	rogerchin85
77	Volkswagen	2018-06-11 02:32:58.379111	41	Open	rogerchin85
78	Porsche	2018-06-11 02:35:28.645366	41	Open	rogerchin85
96	KIA	2018-06-23 05:15:08.854146	43	Open	rogerchin85
49	Honda	2018-06-10 20:24:33.87681	40	Open	rogerchin85
50	Toyota	2018-06-10 20:27:06.203393	40	Open	rogerchin85
51	Acura	2018-06-10 20:29:21.702274	40	Open	rogerchin85
52	Action	2018-06-10 20:33:47.547338	44	Open	rogerchin85
53	Horror	2018-06-10 20:33:49.260321	44	Open	rogerchin85
54	Sci-fi	2018-06-10 20:33:55.902849	44	Open	rogerchin85
55	Documentary	2018-06-10 20:34:02.34459	44	Open	rogerchin85
97	Hyundai	2018-06-23 05:15:33.036258	43	Open	rogerchin85
20	Feet	2018-05-16 16:57:39.68139	2	Open	rogerchin85
24	Back	2018-05-16 17:04:03.443576	3	Closed	rogerchin85
42	Vagina	2018-05-16 17:06:31.758468	5	Open	rogerchin85
60	Nissan	2018-06-11 01:40:13.657744	40	Open	rogerchin85
62	Mitsubishi	2018-06-11 01:45:50.431105	40	Open	rogerchin85
63	Suzuki	2018-06-11 01:46:43.360744	40	Open	rogerchin85
64	Mazda	2018-06-11 01:51:21.146349	40	Open	rogerchin85
65	Ford	2018-06-11 02:01:59.622348	42	Open	rogerchin85
66	Chrysler	2018-06-11 02:06:34.014306	42	Open	rogerchin85
11	Elbow	2018-05-16 16:57:39.68139	2	Open	rogerchin85
15	Finger	2018-05-16 16:57:39.68139	2	Open	rogerchin85
10	Bicep/Tricep	2018-05-16 16:57:39.68139	2	Open	rogerchin85
19	Ankle	2018-05-16 16:57:39.68139	2	Open	rogerchin85
14	Hand	2018-05-16 16:57:39.68139	2	Open	rogerchin85
16	Thigh	2018-05-16 16:57:39.68139	2	Open	rogerchin85
100	Comedy	2018-06-23 05:28:24.091753	44	Open	rogerchin85
101	Romance	2018-06-23 05:28:43.34797	44	Open	rogerchin85
102	Thriller	2018-06-23 05:28:47.66576	44	Open	rogerchin85
103	Drama	2018-06-23 05:28:50.860672	44	Open	rogerchin85
104	Rock	2018-06-23 05:29:50.172066	55	Open	rogerchin85
105	Trance	2018-06-23 05:29:58.480914	55	Open	rogerchin85
106	R & B	2018-06-23 05:35:22.28216	55	Open	rogerchin85
107	Rap	2018-06-23 05:36:01.135009	55	Open	rogerchin85
108	K-Pop	2018-06-23 05:36:44.096278	55	Open	rogerchin85
109	C-Pop	2018-06-23 05:37:52.3326	55	Open	rogerchin85
110	Pop	2018-06-23 05:38:07.766621	55	Open	rogerchin85
111	Hip Hop	2018-06-23 05:38:19.823624	55	Open	rogerchin85
112	Jazz	2018-06-23 05:38:41.986618	55	Open	rogerchin85
113	Country	2018-06-23 05:38:43.621084	55	Open	rogerchin85
114	Metal	2018-06-23 05:38:45.125712	55	Open	rogerchin85
115	Dubstep	2018-06-23 05:38:47.379479	55	Open	rogerchin85
116	Blues	2018-06-23 05:39:23.30018	55	Open	rogerchin85
117	Classical	2018-06-23 05:39:25.096903	55	Open	rogerchin85
118	Sitcoms	2018-06-23 05:42:02.047349	44	Open	rogerchin85
120	MOBA	2018-06-23 05:47:13.97547	74	Open	rogerchin85
90	Computer General	2018-06-17 14:41:40.58131	72	Open	rogerchin85
119	MMO	2018-06-23 05:46:49.884299	74	Open	rogerchin85
121	FPS	2018-06-23 05:47:16.685567	74	Open	rogerchin85
123	Action	2018-06-23 05:50:42.395431	74	Open	rogerchin85
124	Fighting	2018-06-23 05:50:50.488238	74	Open	rogerchin85
125	RTS	2018-06-23 05:51:01.614764	74	Open	rogerchin85
126	RPG	2018-06-23 05:51:16.809999	74	Open	rogerchin85
127	Strategy	2018-06-23 05:51:50.151601	74	Open	rogerchin85
129	CPU	2018-06-23 06:17:51.816471	75	Open	rogerchin85
128	Memory	2018-06-23 06:17:23.262935	75	Open	rogerchin85
130	Motherboard	2018-06-23 06:18:06.830259	75	Open	rogerchin85
131	Graphic Card	2018-06-23 06:22:12.087294	75	Open	rogerchin85
132	Power Supply	2018-06-23 06:22:16.95418	75	Open	rogerchin85
133	Cooling System	2018-06-23 06:22:20.547835	75	Open	rogerchin85
142	Storage	2018-06-23 06:23:22.294084	75	Open	rogerchin85
144	Web Development	2018-06-23 06:25:28.029655	77	Open	rogerchin85
145	Software Development	2018-06-23 06:25:32.693107	77	Open	rogerchin85
146	Database	2018-06-23 06:25:35.996794	77	Open	rogerchin85
147	System Administration	2018-06-23 06:25:47.694606	77	Open	rogerchin85
148	Security	2018-06-23 06:26:00.968209	77	Open	rogerchin85
152	Windows	2018-06-23 06:27:12.108268	76	Open	rogerchin85
153	Linux	2018-06-23 06:27:14.961548	76	Open	rogerchin85
154	Mac	2018-06-23 06:27:17.94302	76	Open	rogerchin85
155	Ubuntu	2018-06-23 06:27:20.56341	76	Open	rogerchin85
156	Electronics General	2018-06-23 06:28:46.746454	78	Open	rogerchin85
157	Android	2018-06-23 06:33:27.919671	79	Open	rogerchin85
158	Apple	2018-06-23 06:33:29.948625	79	Open	rogerchin85
159	Samsung	2018-06-23 06:33:35.524824	79	Open	rogerchin85
160	HTC	2018-06-23 06:33:38.059819	79	Open	rogerchin85
161	LG	2018-06-23 06:33:44.738917	79	Open	rogerchin85
162	ASUS	2018-06-23 06:34:07.722475	79	Open	rogerchin85
163	Sony	2018-06-23 06:34:22.152154	79	Open	rogerchin85
164	Nokia	2018-06-23 06:34:23.148974	79	Open	rogerchin85
165	Motorola	2018-06-23 06:34:26.027376	79	Open	rogerchin85
166	Huawei	2018-06-23 06:34:29.15131	79	Open	rogerchin85
167	Blackberry	2018-06-23 06:34:31.171743	79	Open	rogerchin85
168	Google	2018-06-23 06:34:59.675604	79	Open	rogerchin85
169	OnePlus	2018-06-23 06:35:08.771101	79	Open	rogerchin85
170	Xiaomi	2018-06-23 06:35:10.384349	79	Open	rogerchin85
171	Other	2018-06-23 06:36:18.182687	79	Open	rogerchin85
172	DSLR	2018-06-23 06:37:19.948982	80	Open	rogerchin85
173	Point and Shoot	2018-06-23 06:37:24.845949	80	Open	rogerchin85
174	Dash Cam	2018-06-23 06:37:30.837682	80	Open	rogerchin85
175	Surveillance	2018-06-23 06:37:37.953922	80	Open	rogerchin85
177	Video Recorder	2018-06-23 06:38:47.909478	80	Open	rogerchin85
179	Headphone	2018-06-23 06:39:51.420116	83	Open	rogerchin85
180	Musical Instruments	2018-06-23 06:40:18.118465	83	Open	rogerchin85
181	Hi-Fi	2018-06-23 06:40:19.278552	83	Open	rogerchin85
178	Home Theater Speaker	2018-06-23 06:39:48.154246	83	Open	rogerchin85
182	Samsung	2018-06-23 06:41:38.916622	82	Open	rogerchin85
183	Sony	2018-06-23 06:41:40.060777	82	Open	rogerchin85
184	LG	2018-06-23 06:43:28.277897	82	Open	rogerchin85
185	Insignia	2018-06-23 06:43:30.685168	82	Open	rogerchin85
186	Toshiba	2018-06-23 06:43:32.594291	82	Open	rogerchin85
187	Phillips	2018-06-23 06:43:34.56171	82	Open	rogerchin85
188	Panasonic	2018-06-23 06:43:45.949933	82	Open	rogerchin85
189	Sharp	2018-06-23 06:43:46.859794	82	Open	rogerchin85
190	RCA	2018-06-23 06:44:03.173924	82	Open	rogerchin85
191	Vizio	2018-06-23 06:44:05.098573	82	Open	rogerchin85
192	Viewsonic	2018-06-23 06:44:28.365363	82	Open	rogerchin85
193	Other	2018-06-23 06:44:29.527955	82	Open	rogerchin85
194	Laundry	2018-06-23 06:45:17.599054	81	Open	rogerchin85
195	Kitchen	2018-06-23 06:46:09.303412	81	Open	rogerchin85
196	Virtual Reality	2018-06-23 06:47:36.869106	84	Open	rogerchin85
197	Fitness Tracker	2018-06-23 06:47:40.691632	84	Open	rogerchin85
198	Smart Watch	2018-06-23 06:47:46.660132	84	Open	rogerchin85
199	Healthcare Device	2018-06-23 06:48:40.611436	84	Open	rogerchin85
201	Yoga	2018-06-23 06:50:19.107775	67	Open	rogerchin85
200	Weight	2018-06-23 06:50:13.242518	67	Open	rogerchin85
202	Swimming	2018-06-23 06:52:40.61901	67	Open	rogerchin85
203	Jogging	2018-06-23 06:52:41.959515	67	Open	rogerchin85
204	Climbing	2018-06-23 06:52:49.534301	67	Open	rogerchin85
205	Meditation	2018-06-23 06:53:34.969372	67	Open	rogerchin85
206	Competition	2018-06-23 06:53:38.991304	67	Open	rogerchin85
207	Bodybuilding	2018-06-23 06:55:38.745559	85	Open	rogerchin85
208	Losing Weight	2018-06-23 06:55:47.107872	85	Open	rogerchin85
209	Supplement	2018-06-23 06:55:56.326002	85	Open	rogerchin85
210	Dieting	2018-06-23 06:56:11.35296	85	Open	rogerchin85
211	Top	2018-06-23 06:58:05.435489	86	Open	rogerchin85
212	Bottom	2018-06-23 06:58:06.872504	86	Open	rogerchin85
213	Hat	2018-06-23 06:58:30.290147	87	Open	rogerchin85
214	Earring	2018-06-23 06:58:35.018406	87	Open	rogerchin85
215	Necklace	2018-06-23 06:58:50.420444	87	Open	rogerchin85
216	Watch	2018-06-23 06:58:51.917857	87	Open	rogerchin85
217	Belt	2018-06-23 06:58:53.669363	87	Open	rogerchin85
218	Shoes	2018-06-23 06:58:56.094632	87	Open	rogerchin85
219	Other	2018-06-23 06:59:05.295973	87	Open	rogerchin85
220	Other	2018-06-23 06:59:11.643167	86	Open	rogerchin85
221	Baltimore Orioles	2018-06-23 07:01:07.56212	60	Open	rogerchin85
222	Boston Red Sox	2018-06-23 07:01:10.81584	60	Open	rogerchin85
223	Chicago White Sox	2018-06-23 07:01:14.069094	60	Open	rogerchin85
224	Cleveland Indians	2018-06-23 07:01:21.047612	60	Open	rogerchin85
225	Detroit Tigers	2018-06-23 07:01:24.146931	60	Open	rogerchin85
226	Arizona Diamondbacks	2018-06-23 07:01:29.938743	60	Open	rogerchin85
227	Atlanta Braves	2018-06-23 07:01:35.601932	60	Open	rogerchin85
143	Gamepad	2018-06-23 06:25:16.603358	90	Open	rogerchin85
138	Headphones	2018-06-23 06:22:41.34188	90	Open	rogerchin85
134	Keyboard	2018-06-23 06:22:28.237144	90	Open	rogerchin85
140	Microphone	2018-06-23 06:22:49.978328	90	Open	rogerchin85
136	Monitor	2018-06-23 06:22:32.938226	90	Open	rogerchin85
135	Mouse	2018-06-23 06:22:30.571597	90	Open	rogerchin85
137	Speaker	2018-06-23 06:22:34.753072	90	Open	rogerchin85
139	Webcam	2018-06-23 06:22:45.017127	90	Open	rogerchin85
141	Tower Case	2018-06-23 06:23:20.89672	90	Open	rogerchin85
228	Chicago Cubs	2018-06-23 07:01:40.546062	60	Open	rogerchin85
229	Cincinnati Reds	2018-06-23 07:01:48.443087	60	Open	rogerchin85
230	Colorado Rockies	2018-06-23 07:01:53.961804	60	Open	rogerchin85
231	Houston Astros	2018-06-23 07:02:04.246849	60	Open	rogerchin85
232	Los Angeles Dodgers	2018-06-23 07:02:10.470247	60	Open	rogerchin85
233	Kansas City Royals	2018-06-23 07:02:15.045924	60	Open	rogerchin85
234	Miami Marlins	2018-06-23 07:02:19.39221	60	Open	rogerchin85
235	Los Angeles Angels of Anaheim	2018-06-23 07:02:31.562482	60	Open	rogerchin85
236	Milwaukee Brewers	2018-06-23 07:02:36.30815	60	Open	rogerchin85
237	Minnesota Twins	2018-06-23 07:02:40.560057	60	Open	rogerchin85
238	New York Mets	2018-06-23 07:02:43.477817	60	Open	rogerchin85
239	New York Yankees	2018-06-23 07:02:47.405705	60	Open	rogerchin85
240	Philadelphia Phillies	2018-06-23 07:02:52.635418	60	Open	rogerchin85
241	Oakland Athletics	2018-06-23 07:03:01.837195	60	Open	rogerchin85
243	Seattle Mariners	2018-06-23 07:03:15.149386	60	Open	rogerchin85
244	San Diego Padres	2018-06-23 07:03:18.928626	60	Open	rogerchin85
245	Tampa Bay Rays	2018-06-23 07:03:22.857658	60	Open	rogerchin85
246	San Francisco Giants	2018-06-23 07:03:26.451393	60	Open	rogerchin85
247	Texas Rangers	2018-06-23 07:03:29.41784	60	Open	rogerchin85
248	St. Louis Cardinals	2018-06-23 07:03:35.766979	60	Open	rogerchin85
249	Toronto Blue Jays	2018-06-23 07:03:39.663221	60	Open	rogerchin85
250	Washington Nationals	2018-06-23 07:03:45.475309	60	Open	rogerchin85
251	Arizona Cardinals	2018-06-23 07:04:12.810711	58	Open	rogerchin85
252	Atlanta Falcons	2018-06-23 07:04:19.534189	58	Open	rogerchin85
253	Baltimore Ravens	2018-06-23 07:04:23.301976	58	Open	rogerchin85
254	Buffalo Bills	2018-06-23 07:04:27.43854	58	Open	rogerchin85
255	Carolina Panthers	2018-06-23 07:04:31.096898	58	Open	rogerchin85
256	Chicago Bears	2018-06-23 07:04:34.816299	58	Open	rogerchin85
257	Cincinnati Bengals	2018-06-23 07:04:39.118672	58	Open	rogerchin85
258	Cleveland Browns	2018-06-23 07:04:48.591177	58	Open	rogerchin85
259	Dallas Cowboys	2018-06-23 07:04:52.283309	58	Open	rogerchin85
260	Denver Broncos	2018-06-23 07:04:56.617719	58	Open	rogerchin85
261	Detroit Lions	2018-06-23 07:05:01.498265	58	Open	rogerchin85
262	Green Bay Packers	2018-06-23 07:05:04.170694	58	Open	rogerchin85
263	Houston Texans	2018-06-23 07:05:09.624006	58	Open	rogerchin85
264	Indianapolis Colts	2018-06-23 07:05:20.735597	58	Open	rogerchin85
265	Jacksonville Jaguars	2018-06-23 07:05:24.901821	58	Open	rogerchin85
266	Los Angeles Chargers	2018-06-23 07:05:33.625454	58	Open	rogerchin85
267	Los Angeles Rams	2018-06-23 07:05:36.708147	58	Open	rogerchin85
268	Miami Dolphins	2018-06-23 07:05:40.052415	58	Open	rogerchin85
269	Minnesota Vikings	2018-06-23 07:05:44.436044	58	Open	rogerchin85
270	New England Patriots	2018-06-23 07:05:48.359938	58	Open	rogerchin85
271	New Orleans Saints	2018-06-23 07:06:09.553481	58	Open	rogerchin85
272	New York Giants	2018-06-23 07:06:13.300557	58	Open	rogerchin85
273	New York Jets	2018-06-23 07:06:16.810445	58	Open	rogerchin85
274	Oakland Raiders	2018-06-23 07:06:23.384951	58	Open	rogerchin85
275	Philadelphia Eagles	2018-06-23 07:06:27.043924	58	Open	rogerchin85
276	Pittsburgh Steelers	2018-06-23 07:06:32.757426	58	Open	rogerchin85
277	San Francisco 49ers	2018-06-23 07:06:39.221647	58	Open	rogerchin85
278	Seattle Seahawks	2018-06-23 07:06:44.327597	58	Open	rogerchin85
279	Tampa Bay Buccaneers	2018-06-23 07:06:49.268787	58	Open	rogerchin85
280	Tennessee Titans	2018-06-23 07:06:54.799419	58	Open	rogerchin85
281	Washington Redskins	2018-06-23 07:07:00.734026	58	Open	rogerchin85
282	Other	2018-06-23 07:07:36.075769	60	Open	rogerchin85
242	Pittsburgh Pirates	2018-06-23 07:03:08.803107	60	Open	rogerchin85
283	Other	2018-06-23 07:07:55.516727	58	Open	rogerchin85
284	Carolina Hurricanes	2018-06-23 07:08:11.724783	57	Open	rogerchin85
285	Columbus Blue Jackets	2018-06-23 07:08:15.74718	57	Open	rogerchin85
286	New Jersey Devils	2018-06-23 07:08:19.074205	57	Open	rogerchin85
287	New York Islanders	2018-06-23 07:08:23.645155	57	Open	rogerchin85
288	New York Rangers	2018-06-23 07:08:26.470014	57	Open	rogerchin85
289	Philadelphia Flyers	2018-06-23 07:08:30.453422	57	Open	rogerchin85
290	Pittsburgh Penguins	2018-06-23 07:08:36.152295	57	Open	rogerchin85
291	Washington Capitals	2018-06-23 07:08:40.784845	57	Open	rogerchin85
292	Boston Bruins	2018-06-23 07:08:43.288292	57	Open	rogerchin85
293	Buffalo Sabres	2018-06-23 07:08:55.358552	57	Open	rogerchin85
294	Detroit Red Wings	2018-06-23 07:09:02.075476	57	Open	rogerchin85
295	Florida Panthers	2018-06-23 07:09:06.255881	57	Open	rogerchin85
296	Montreal Canadiens	2018-06-23 07:09:12.556036	57	Open	rogerchin85
297	Ottawa Senators	2018-06-23 07:09:15.779236	57	Open	rogerchin85
298	Tampa Bay Lightning	2018-06-23 07:09:20.093611	57	Open	rogerchin85
299	Toronto Maple Leafs	2018-06-23 07:09:25.427458	57	Open	rogerchin85
300	Chicago Blackhawks	2018-06-23 07:09:32.482931	57	Open	rogerchin85
301	Colorado Avalanche	2018-06-23 07:09:38.083038	57	Open	rogerchin85
302	Dallas Stars	2018-06-23 07:09:41.000811	57	Open	rogerchin85
303	Minnesota Wild	2018-06-23 07:09:45.440122	57	Open	rogerchin85
304	Nashville Predators	2018-06-23 07:09:48.817248	57	Open	rogerchin85
305	St. Louis Blues	2018-06-23 07:09:53.327931	57	Open	rogerchin85
306	Winnipeg Jets	2018-06-23 07:10:02.23769	57	Open	rogerchin85
307	Anaheim Ducks	2018-06-23 07:10:06.372171	57	Open	rogerchin85
308	Arizona Coyotes	2018-06-23 07:10:10.143246	57	Open	rogerchin85
309	Calgary Flames	2018-06-23 07:10:13.040222	57	Open	rogerchin85
310	Edmonton Oilers	2018-06-23 07:10:18.433703	57	Open	rogerchin85
311	Los Angeles Kings	2018-06-23 07:10:22.319441	57	Open	rogerchin85
312	San Jose Sharks	2018-06-23 07:10:26.822784	57	Open	rogerchin85
313	Vancouver Canucks	2018-06-23 07:10:30.054675	57	Open	rogerchin85
314	Vegas Golden Knights	2018-06-23 07:10:35.328025	57	Open	rogerchin85
315	UFC	2018-06-23 07:14:13.278131	73	Open	rogerchin85
316	Strikeforce	2018-06-23 07:14:15.449707	73	Open	rogerchin85
317	Pride	2018-06-23 07:14:18.988626	73	Open	rogerchin85
318	Bellator	2018-06-23 07:14:21.81856	73	Open	rogerchin85
321	Boxing	2018-06-23 07:14:38.058912	73	Open	rogerchin85
322	Wrestling	2018-06-23 07:15:00.492053	73	Open	rogerchin85
323	Karate	2018-06-23 07:15:11.186609	73	Open	rogerchin85
324	Taekwondo	2018-06-23 07:15:13.957895	73	Open	rogerchin85
320	Kickboxing	2018-06-23 07:14:30.919725	73	Open	rogerchin85
325	Judo	2018-06-23 07:15:22.06542	73	Open	rogerchin85
319	Jiu-jitsu	2018-06-23 07:14:28.463625	73	Open	rogerchin85
326	Argentina	2018-06-23 07:16:29.160562	59	Open	rogerchin85
327	Australia	2018-06-23 07:16:32.943915	59	Open	rogerchin85
328	Belgium	2018-06-23 07:16:34.232547	59	Open	rogerchin85
329	Brazil	2018-06-23 07:16:35.466854	59	Open	rogerchin85
330	Colombia	2018-06-23 07:16:40.351167	59	Open	rogerchin85
331	Costa Rica	2018-06-23 07:16:42.606239	59	Open	rogerchin85
332	Croatia	2018-06-23 07:16:47.257064	59	Open	rogerchin85
333	Denmark	2018-06-23 07:19:04.57175	59	Open	rogerchin85
334	Egypt	2018-06-23 07:19:09.352209	59	Open	rogerchin85
335	England	2018-06-23 07:19:10.933817	59	Open	rogerchin85
336	France	2018-06-23 07:19:12.231415	59	Open	rogerchin85
337	Germany	2018-06-23 07:19:14.671898	59	Open	rogerchin85
338	Iceland	2018-06-23 07:19:20.299723	59	Open	rogerchin85
339	Iran	2018-06-23 07:19:31.00803	59	Open	rogerchin85
340	Japan	2018-06-23 07:19:32.437264	59	Open	rogerchin85
341	Korea	2018-06-23 07:19:33.765339	59	Open	rogerchin85
342	Mexico	2018-06-23 07:19:42.073152	59	Open	rogerchin85
343	Morocco	2018-06-23 07:19:43.977695	59	Open	rogerchin85
344	Nigeria	2018-06-23 07:19:50.297784	59	Open	rogerchin85
345	Panama	2018-06-23 07:19:51.52145	59	Open	rogerchin85
346	Peru	2018-06-23 07:19:55.573751	59	Open	rogerchin85
347	Poland	2018-06-23 07:19:56.664479	59	Open	rogerchin85
348	Portugal	2018-06-23 07:19:58.770133	59	Open	rogerchin85
349	Russia	2018-06-23 07:20:00.149579	59	Open	rogerchin85
350	Saudi Arabia	2018-06-23 07:20:07.467865	59	Open	rogerchin85
351	Senegal	2018-06-23 07:20:09.026301	59	Open	rogerchin85
352	Serbia	2018-06-23 07:20:13.826295	59	Open	rogerchin85
353	Spain	2018-06-23 07:20:15.409224	59	Open	rogerchin85
354	Sweden	2018-06-23 07:20:17.007348	59	Open	rogerchin85
355	Switzerland	2018-06-23 07:20:19.83504	59	Open	rogerchin85
356	Tunisia	2018-06-23 07:20:25.474758	59	Open	rogerchin85
357	Uruguay	2018-06-23 07:20:28.385151	59	Open	rogerchin85
358	Other	2018-06-23 07:20:29.491879	59	Open	rogerchin85
359	Other	2018-06-23 07:20:37.344377	73	Open	rogerchin85
360	Other	2018-06-23 07:20:45.543545	57	Open	rogerchin85
361	Atlanta Hawks	2018-06-23 07:21:19.35112	88	Open	rogerchin85
362	Boston Celtics	2018-06-23 07:21:24.326121	88	Open	rogerchin85
363	Brooklyn Nets	2018-06-23 07:21:27.882482	88	Open	rogerchin85
364	Charlotte Hornets	2018-06-23 07:21:31.29027	88	Open	rogerchin85
365	Chicago Bulls	2018-06-23 07:21:34.985912	88	Open	rogerchin85
366	Cleveland Cavaliers	2018-06-23 07:21:38.91348	88	Open	rogerchin85
367	Dallas Mavericks	2018-06-23 07:21:42.86527	88	Open	rogerchin85
368	Denver Nuggets	2018-06-23 07:21:48.806064	88	Open	rogerchin85
369	Detroit Pistons	2018-06-23 07:21:52.376489	88	Open	rogerchin85
370	Golden State Warriors	2018-06-23 07:21:57.736261	88	Open	rogerchin85
371	Houston Rockets	2018-06-23 07:21:59.989292	88	Open	rogerchin85
372	Indiana Pacers	2018-06-23 07:22:05.097027	88	Open	rogerchin85
373	LA Clippers	2018-06-23 07:22:08.303111	88	Open	rogerchin85
374	Los Angeles Lakers	2018-06-23 07:22:15.345152	88	Open	rogerchin85
375	Memphis Grizzlies	2018-06-23 07:22:20.041705	88	Open	rogerchin85
376	Miami Heat	2018-06-23 07:22:22.019197	88	Open	rogerchin85
377	Milwaukee Bucks	2018-06-23 07:22:26.159034	88	Open	rogerchin85
378	Minnesota Timberwolves	2018-06-23 07:22:30.945306	88	Open	rogerchin85
379	New Orleans Pelicans	2018-06-23 07:22:35.65972	88	Open	rogerchin85
380	New York Knicks	2018-06-23 07:22:43.395527	88	Open	rogerchin85
381	Oklahoma City Thunder	2018-06-23 07:22:48.909113	88	Open	rogerchin85
382	Orlando Magic	2018-06-23 07:22:51.620323	88	Open	rogerchin85
383	Philadelphia 76ers	2018-06-23 07:22:56.306101	88	Open	rogerchin85
384	Phoenix Suns	2018-06-23 07:23:00.322285	88	Open	rogerchin85
385	Portland Trail Blazers	2018-06-23 07:23:05.777947	88	Open	rogerchin85
386	Sacramento Kings	2018-06-23 07:23:09.892332	88	Open	rogerchin85
387	San Antonio Spurs	2018-06-23 07:23:15.282518	88	Open	rogerchin85
388	Toronto Raptors	2018-06-23 07:23:30.693543	88	Open	rogerchin85
389	Utah Jazz	2018-06-23 07:23:33.726829	88	Open	rogerchin85
390	Washington Wizards	2018-06-23 07:23:39.676682	88	Open	rogerchin85
391	Other	2018-06-23 07:23:40.759183	88	Open	rogerchin85
392	Celebrities	2018-06-23 07:32:01.582423	44	Open	rogerchin85
\.


--
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY topics (topic_id, topic_title, topic_created_on, topic_category, topic_created_by, topic_status) FROM stdin;
1	Head	2018-05-15 22:00:23.012621	1	\N	Open
2	Limbs	2018-05-15 22:00:23.012621	1	\N	Open
3	Body	2018-05-15 22:00:23.012621	1	\N	Open
4	Organs	2018-05-15 22:00:23.012621	1	\N	Open
40	Japanese	2018-06-10 19:55:05.878358	2	rogerchin85	Open
41	German	2018-06-10 19:55:07.766218	2	rogerchin85	Open
42	American	2018-06-10 19:55:11.080824	2	rogerchin85	Open
43	Korean	2018-06-10 19:55:13.358202	2	rogerchin85	Open
75	Hardware	2018-06-23 06:15:56.739462	6	rogerchin85	Open
55	Music	2018-06-11 02:48:56.398731	3	rogerchin85	Open
76	Software	2018-06-23 06:16:04.75261	6	rogerchin85	Open
57	Hockey	2018-06-11 02:51:29.966126	4	rogerchin85	Open
58	Football	2018-06-11 02:55:34.099154	4	rogerchin85	Open
59	Soccer	2018-06-11 02:56:09.522884	4	rogerchin85	Open
60	Baseball	2018-06-11 03:09:13.122194	4	rogerchin85	Open
5	Genitals	2018-05-16 17:05:08.660227	1	\N	Open
77	Programming	2018-06-23 06:20:42.628204	6	rogerchin85	Open
72	Computer General	2018-06-17 14:41:28.53617	6	rogerchin85	Open
78	Electronics General	2018-06-23 06:28:37.33657	7	rogerchin85	Open
79	Mobile Device	2018-06-23 06:29:20.524612	7	rogerchin85	Open
80	Camera	2018-06-23 06:29:23.068553	7	rogerchin85	Open
66	Health General	2018-06-15 00:34:10.142797	1	rogerchin85	Open
68	Automotive General	2018-06-15 01:21:43.047175	2	rogerchin85	Open
69	Fitness General	2018-06-15 01:22:48.650739	5	rogerchin85	Open
70	Entertainment General	2018-06-15 01:23:05.704303	3	rogerchin85	Open
71	Sports General	2018-06-15 01:23:22.330048	4	rogerchin85	Open
82	Television	2018-06-23 06:30:40.509871	7	rogerchin85	Open
44	Movies & TV Shows	2018-06-10 20:33:39.382978	3	rogerchin85	Open
73	Mixed Martial Arts	2018-06-23 05:46:24.943014	4	rogerchin85	Open
74	Video Games	2018-06-23 05:46:37.465444	3	rogerchin85	Open
84	Wearable	2018-06-23 06:31:40.645898	7	rogerchin85	Open
83	Audio	2018-06-23 06:30:42.215895	7	rogerchin85	Open
81	Appliance	2018-06-23 06:29:29.219859	7	rogerchin85	Open
67	Training	2018-06-15 01:07:28.609232	5	rogerchin85	Open
85	Diet & Supplement	2018-06-23 06:49:01.993639	5	rogerchin85	Open
86	Clothing	2018-06-23 06:57:27.127006	8	rogerchin85	Open
87	Accessories	2018-06-23 06:57:28.83861	8	rogerchin85	Open
88	Basketball	2018-06-23 06:59:40.587826	4	rogerchin85	Open
90	Peripheral	2018-06-29 18:10:24.255764	6	rogerchin85	Open
\.


--
-- Data for Name: user_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY user_reports (r_id, reported_id, reported_by, reported_type, reported_on, report_action) FROM stdin;
1	2	niceuser	forum	2018-06-18 18:52:58.605954	Pending
4	3	niceuser	forum	2018-06-18 18:56:24.338525	Pending
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY users (user_id, username, password, email, last_login, privilege, user_status, user_level, receive_email, show_online, avatar_url, user_created, user_confirmed, hide_email, online_status) FROM stdin;
31	niceuser	$2b$10$q.QBUvuo3IgjQwJ9CkPRxOoeAeQfqjdUStOAdX7O51tr1UlXEmnqi	niceuser@nice.com	2018-06-23 04:59:26.669	0	Active	Newcomer	f	t	/files/31/profile_pic/niceuser_profile_pic.png	2018-06-18 17:34:10.107708	\N	f	Offline
25	admin	$2b$10$22afMe/2BDqK2FiLLTaI7.IAL3q9lZgOaT3wJzu8saduWTKBQrPdy	admin@admin.com	2018-06-18 15:25:35.846	2	Active	Administrator	t	t	/files/25/profile_pic/admin_profile_pic.png	2018-06-02 00:21:41.275662	2018-06-02 00:22:22.271999	f	Offline
30	testuser2	$2b$10$N5HlESSkpFcjkcuYkJDQ5et5sx55WoErZItvt/YhdVZpgKz.acXay	testuser2@test.com	2018-06-27 18:55:13.559	0	Suspended	Newcomer	f	t	/files/30/profile_pic/testuser2_profile_pic.png	2018-06-02 09:13:20.090973	\N	t	Offline
4	testuser	$2b$10$HPI6rbATSc9Qys/4vqIEou8MZTBMLmHDjQSKTUg1rKbB0WovA9edm	test@test.com	2018-06-27 19:56:28.286	1	Active	Moderator	t	t	/files/4/profile_pic/testuser_profile_pic.png	2018-06-02 00:21:41.275662	2018-06-02 00:22:22.271999	f	Offline
1	rogerchin85	$2b$10$bCHC5LvPX0bP41ZJ4pX7uOnlz5u.m.K1IkkPcB9dMIsJ0npA.ZKVO	rogerchin85@gmail.com	2018-06-29 18:09:51.354	3	Active	Owner	t	f	/files/1/profile_pic/rogerchin85_profile_pic.png	2018-06-02 00:21:41.275662	2018-06-02 00:22:22.271999	f	Offline
\.


--
-- Data for Name: violations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY violations (v_id, v_user_id, violation, v_date, v_issued_by) FROM stdin;
1	25	Your profile pic violates the terms of service.	2018-06-02 09:57:31.172419	1
2	30	Your profile pic violates the terms of service.	2018-06-02 09:57:54.737453	1
5	30	cause i feel like it	2018-06-27 18:56:36.75225	1
\.


--
-- Data for Name: vote_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY vote_tracking (voting_user_id, voting_post_id, vote) FROM stdin;
1	2	down
1	3	up
1	4	up
1	18	up
1	1	up
1	17	down
1	19	down
4	18	up
4	1	down
4	17	down
4	19	down
4	2	down
4	4	up
4	3	down
30	1	up
30	2	up
30	3	up
30	4	up
1	21	up
25	18	up
25	21	up
25	1	up
25	30	up
25	23	up
25	19	up
25	17	up
31	2	down
31	3	up
31	48	up
31	18	up
\.


--
-- Name: category_cat_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('category_cat_id_seq', 10, true);


--
-- Name: config_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('config_config_id_seq', 2, true);


--
-- Name: followed_posts_followed_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('followed_posts_followed_id_seq', 1, true);


--
-- Name: messages_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('messages_message_id_seq', 1, false);


--
-- Name: posts_post_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('posts_post_id_seq', 57, true);


--
-- Name: subtopics_subtopic_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('subtopics_subtopic_id_seq', 392, true);


--
-- Name: topics_topic_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('topics_topic_id_seq', 90, true);


--
-- Name: user_reports_r_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('user_reports_r_id_seq', 4, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('users_user_id_seq', 31, true);


--
-- Name: violations_v_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('violations_v_id_seq', 5, true);


--
-- Name: categories category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY categories
    ADD CONSTRAINT category_pkey PRIMARY KEY (cat_id);


--
-- Name: config config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY config
    ADD CONSTRAINT config_pkey PRIMARY KEY (config_id);


--
-- Name: followed_posts followed_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY followed_posts
    ADD CONSTRAINT followed_posts_pkey PRIMARY KEY (followed_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (message_id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (post_id);


--
-- Name: subtopics subtopics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY subtopics
    ADD CONSTRAINT subtopics_pkey PRIMARY KEY (subtopic_id);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (topic_id);


--
-- Name: user_reports unique_report; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_reports
    ADD CONSTRAINT unique_report UNIQUE (reported_id, reported_by, reported_type);


--
-- Name: vote_tracking unique_rows; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY vote_tracking
    ADD CONSTRAINT unique_rows UNIQUE (voting_user_id, voting_post_id);


--
-- Name: subtopics unique_subtopic_topic; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY subtopics
    ADD CONSTRAINT unique_subtopic_topic UNIQUE (subtopic_title, belongs_to_topic);


--
-- Name: topics unique_title; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY topics
    ADD CONSTRAINT unique_title UNIQUE (topic_title);


--
-- Name: user_reports user_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_reports
    ADD CONSTRAINT user_reports_pkey PRIMARY KEY (r_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: violations violations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY violations
    ADD CONSTRAINT violations_pkey PRIMARY KEY (v_id);


--
-- Name: categories category_cat_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY categories
    ADD CONSTRAINT category_cat_created_by_fkey FOREIGN KEY (cat_created_by) REFERENCES users(username);


--
-- Name: subtopics fkey_subtopics_created_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY subtopics
    ADD CONSTRAINT fkey_subtopics_created_by FOREIGN KEY (subtopic_created_by) REFERENCES users(username);


--
-- Name: followed_posts followed_posts_followed_post_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY followed_posts
    ADD CONSTRAINT followed_posts_followed_post_fkey FOREIGN KEY (followed_post) REFERENCES posts(post_id) ON DELETE CASCADE;


--
-- Name: followed_posts followed_posts_user_following_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY followed_posts
    ADD CONSTRAINT followed_posts_user_following_fkey FOREIGN KEY (user_following) REFERENCES users(username);


--
-- Name: messages messages_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY messages
    ADD CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient) REFERENCES users(username) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender) REFERENCES users(username) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: posts posts_belongs_to_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY posts
    ADD CONSTRAINT posts_belongs_to_post_id_fkey FOREIGN KEY (belongs_to_post_id) REFERENCES posts(post_id) ON DELETE CASCADE;


--
-- Name: posts posts_post_topic_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY posts
    ADD CONSTRAINT posts_post_topic_fkey FOREIGN KEY (post_topic) REFERENCES subtopics(subtopic_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: posts posts_post_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY posts
    ADD CONSTRAINT posts_post_user_fkey FOREIGN KEY (post_user) REFERENCES users(username);


--
-- Name: posts posts_reply_to_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY posts
    ADD CONSTRAINT posts_reply_to_post_id_fkey FOREIGN KEY (reply_to_post_id) REFERENCES posts(post_id) ON DELETE CASCADE;


--
-- Name: subtopics subtopics_belongs_to_topic_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY subtopics
    ADD CONSTRAINT subtopics_belongs_to_topic_fkey FOREIGN KEY (belongs_to_topic) REFERENCES topics(topic_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: topics topics_topic_category_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY topics
    ADD CONSTRAINT topics_topic_category_fkey FOREIGN KEY (topic_category) REFERENCES categories(cat_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: topics topics_topic_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY topics
    ADD CONSTRAINT topics_topic_created_by_fkey FOREIGN KEY (topic_created_by) REFERENCES users(username);


--
-- Name: user_reports user_reports_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_reports
    ADD CONSTRAINT user_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES users(username) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: violations violations_v_issued_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY violations
    ADD CONSTRAINT violations_v_issued_by_fkey FOREIGN KEY (v_issued_by) REFERENCES users(user_id);


--
-- Name: violations violations_v_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY violations
    ADD CONSTRAINT violations_v_user_id_fkey FOREIGN KEY (v_user_id) REFERENCES users(user_id);


--
-- Name: vote_tracking vote_tracking_voting_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY vote_tracking
    ADD CONSTRAINT vote_tracking_voting_post_id_fkey FOREIGN KEY (voting_post_id) REFERENCES posts(post_id) ON DELETE CASCADE;


--
-- Name: vote_tracking vote_tracking_voting_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY vote_tracking
    ADD CONSTRAINT vote_tracking_voting_user_id_fkey FOREIGN KEY (voting_user_id) REFERENCES users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

