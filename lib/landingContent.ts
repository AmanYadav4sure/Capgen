export type LandingContent = {
  title: string;
  description: string;
  eyebrow: string;
  kind: string;
  section: string;
  cards: [string, string][];
  workflowTitle: string;
  steps: string[];
  faqs: [string, string][];
  related: string[];
};

export const landingContent: Record<string, LandingContent> = {
  '/use-cases': {
    title: 'Video captions for creators, podcasts and teams',
    description:
      'Capgen turns speech in an uploaded video into timed captions. Choose a workflow for your content, style the words in the browser, and export a captioned video or an SRT subtitle file.',
    eyebrow: 'USE CASES',
    kind: 'coral',
    section: 'Choose your captioning workflow',
    cards: [
      [
        'Creators',
        'Caption your own vlogs, demonstrations and personal-brand clips. Use word highlights to emphasize the spoken message while leaving enough room for the subject.',
      ],
      [
        'Podcasters',
        'Start with a video excerpt from your conversation. Generate captions for the excerpt and choose a readable style for the speaker and background.',
      ],
      [
        'Agencies',
        'Apply consistent fonts, colors and caption placement to client video exports. Each project can be restyled and exported again without another video credit.',
      ],
      [
        'Education',
        'Add text to recorded explanations and course excerpts. Review technical names and numbers, and use an SRT file when a separate subtitle track is needed.',
      ],
    ],
    workflowTitle: 'One editor, different video formats',
    steps: [
      'Prepare the video you want to caption and upload it to the studio. Select the spoken language.',
      'Generate the transcript, then preview the words against the audio. Check names, accents and background noise before publishing.',
      'Pick fonts, colors, animation and a 9:16, 1:1 or 16:9 canvas. Export the video or download the SRT text.',
    ],
    faqs: [
      [
        'Does Capgen generate the video itself?',
        'Capgen captions a video you provide. It does not generate footage, write a social post, or publish to social networks.',
      ],
      [
        'Can I try the workflow for free?',
        'New accounts start with five video credits and a 100 MB upload limit. See Pricing for paid plans and larger upload allowances.',
      ],
    ],
    related: [
      '/use-cases/creators',
      '/use-cases/podcasters',
      '/use-cases/agencies',
      '/use-cases/education',
    ],
  },
  '/use-cases/creators': {
    title: 'AI video captions for creators and vlogs',
    description:
      'Add spoken-word captions to talking-head videos, vlogs and demonstrations with Capgen. Create an animated video export for your feed or keep the subtitles as an SRT file for another editor.',
    eyebrow: 'FOR CREATORS',
    kind: 'coral',
    section: 'Keep the story visible on a small screen',
    cards: [
      [
        'Talking-head videos',
        'Use a short caption phrase so the speaker remains the focus. Word highlights give viewers a visual cue as the audio moves through a sentence.',
      ],
      [
        'Travel and daily vlogs',
        'Keep captions away from important details in the footage. Preview both bright and dark scenes before choosing a text color and stroke.',
      ],
      [
        'Product demonstrations',
        'Position captions clear of the object or action being shown. Check product names in the transcript before using the result publicly.',
      ],
      [
        'Repeatable styling',
        'Choose a preset, then adjust the font, highlight color and placement. Re-export an existing project when you need a different caption treatment.',
      ],
    ],
    workflowTitle: 'Caption your next creator video',
    steps: [
      'Upload the edited clip you plan to post. Select the language spoken in the recording.',
      'Generate captions and play the preview with sound. Automatic transcription can mishear names or words in noisy footage.',
      'Choose a caption style and aspect ratio. Export, then review the downloaded video before uploading it to your platform.',
    ],
    faqs: [
      [
        'Are these social post captions?',
        'These are subtitles displayed inside your video. Capgen does not generate Instagram descriptions, hashtags or post text.',
      ],
      [
        'Do I need to pay again to change the style?',
        'A credited project can be styled and re-exported without spending another video credit.',
      ],
    ],
    related: ['/platforms/instagram', '/platforms/tiktok', '/templates'],
  },
  '/use-cases/podcasters': {
    title: 'Automatic captions for video podcast clips',
    description:
      'Make spoken conversations easier to follow with subtitles on your video podcast excerpts. Upload a prepared clip, generate word timestamps, and export styled captions or a separate SRT file.',
    eyebrow: 'FOR PODCASTERS',
    kind: 'purple',
    section: 'Prepare a readable conversation clip',
    cards: [
      [
        'Start with an excerpt',
        'Trim the conversation in your video editor before uploading. Capgen captions the footage you provide; it does not automatically select highlights from an episode.',
      ],
      [
        'Check overlapping speech',
        'Two people speaking together can make automatic transcription harder. Listen to the preview and review the text before publishing a quotation.',
      ],
      [
        'Choose restrained emphasis',
        'Use readable fonts and short phrases for interviews. A highlight color can follow each spoken word without distracting from the conversation.',
      ],
      [
        'Keep a subtitle file',
        'Download SRT when you need timed text for another editing workflow. SRT stores the wording and timing, rather than Capgen animation or styling.',
      ],
    ],
    workflowTitle: 'From prepared excerpt to captioned podcast video',
    steps: [
      'Export a podcast video excerpt from your recording software and upload that file to Capgen.',
      'Generate the captions in the spoken language. Review speaker names, terminology and any overlapping dialogue.',
      'Style the captions and choose a canvas for the destination. Export a video for social sharing or download SRT for further editing.',
    ],
    faqs: [
      [
        'Does Capgen make podcast clips automatically?',
        'No. Prepare your clip first, then use Capgen to transcribe and style the captions.',
      ],
      [
        'Can I upload an audio-only episode?',
        'The studio upload workflow expects a video. Combine the audio with a visual in your video editor before captioning it here.',
      ],
    ],
    related: ['/platforms/youtube', '/platforms/linkedin', '/features/srt-subtitles'],
  },
  '/use-cases/agencies': {
    title: 'Branded video caption workflows for agencies',
    description:
      'Style captions for client videos in Capgen using fonts, colors, word highlights and placement controls. Export individual projects and revise their visual treatment without extra re-export credits.',
    eyebrow: 'FOR AGENCIES',
    kind: 'yellow',
    section: 'Deliver captions that fit each client',
    cards: [
      [
        'Match the visual identity',
        'Choose a font, text color and highlight treatment for the client. Check caption contrast over the actual footage rather than relying on a preset alone.',
      ],
      [
        'Prepare each video',
        'Upload an edited client file and generate its transcript. The workflow is for individual projects; shared approvals and batch processing are not built-in features.',
      ],
      [
        'Adapt the canvas',
        'Use a vertical, square or landscape canvas to prepare different deliverables. Check faces, demonstrations and captions after changing the aspect ratio.',
      ],
      [
        'Review and revise',
        'Play the video with the client wording in mind. Style changes and re-exports of the same credited project do not consume another video credit.',
      ],
    ],
    workflowTitle: 'A practical client handoff',
    steps: [
      'Confirm permission to process the footage and upload the final edit. Choose the spoken language.',
      'Generate captions and preview the result. Validate client names, product terms and any compliance-sensitive wording in your existing review process.',
      'Set the caption styling and canvas, export the file, and send it through your normal client approval workflow.',
    ],
    faqs: [
      [
        'Does the Team plan include shared approvals?',
        'The current studio does not provide shared approval queues or collaborative editing. Pricing describes the available credits and upload limits.',
      ],
      [
        'Can I export subtitles for a client editor?',
        'Yes. Download SRT to transfer the timed text. Animated styling remains in the rendered video export.',
      ],
    ],
    related: ['/pricing', '/platforms/linkedin', '/templates'],
  },
  '/use-cases/education': {
    title: 'Video captions for lessons and course excerpts',
    description:
      'Generate subtitles for recorded lessons, demonstrations and course clips. Capgen supplies word timestamps and visual styling, with SRT download for a separate timed-text workflow.',
    eyebrow: 'FOR EDUCATION',
    kind: 'blue',
    section: 'Make the explanation easier to follow',
    cards: [
      [
        'Recorded explanations',
        'Caption the words in a short lesson so viewers can follow the spoken explanation. Keep enough room for diagrams or notes shown in the video.',
      ],
      [
        'Technical vocabulary',
        'Automatic transcription may mishear specialized words and numerical values. Review the recording and subtitle text before sharing educational material.',
      ],
      [
        'Readable presentation',
        'Use clear type, strong contrast and restrained animation for lessons. Avoid placing text over the part of a demonstration students need to inspect.',
      ],
      [
        'Separate subtitles',
        'Use SRT when your video player or editing software supports a separate subtitle track. Burned-in video captions remain visible in the exported footage.',
      ],
    ],
    workflowTitle: 'Prepare captions for a learning video',
    steps: [
      'Upload the lesson clip in the spoken language. Remove private student information from the footage before processing it.',
      'Generate the transcript and review terminology, formula names and numbers. An automatic transcript is a draft that needs checking.',
      'Choose a readable treatment. Export the video, or download SRT and review it in the course player or editor you use.',
    ],
    faqs: [
      [
        'Do generated captions guarantee accessibility compliance?',
        'No. Review accuracy, reading speed and presentation for your audience and applicable requirements. Automatic captions alone do not establish compliance.',
      ],
      [
        'Can I correct an SRT file?',
        'Yes. Download SRT and edit the text or cue times in a subtitle editor. The studio currently focuses on visual styling rather than editing individual words.',
      ],
    ],
    related: ['/features/srt-subtitles', '/templates', '/privacy'],
  },
  '/platforms/instagram': {
    title: 'Instagram Reels video caption generator',
    description:
      'Turn speech in your Reel into animated subtitles with Capgen. Upload your own edited video, choose a vertical canvas, customize the captions and export a file you can upload to Instagram.',
    eyebrow: 'INSTAGRAM REELS',
    kind: 'coral',
    section: 'Caption the video inside your Reel',
    cards: [
      [
        'Spoken-word subtitles',
        'Generate timed text from the audio in your Reel. This tool creates on-video subtitles, rather than post descriptions, hashtags or social copy.',
      ],
      [
        'Vertical canvas',
        'Choose 9:16 for a vertical composition. Preview the crop so faces and actions remain visible when fitting the uploaded footage to the canvas.',
      ],
      [
        'Caption placement',
        'Move the captions away from important content. Review the exported video in Instagram before posting, since platform controls can cover portions of the frame.',
      ],
      [
        'Word highlights',
        'Use a preset or your own text and highlight colors. Keep the phrase readable over the changing backgrounds of a vlog or demonstration.',
      ],
    ],
    workflowTitle: 'Add captions to an Instagram Reel',
    steps: [
      'Upload your prepared video to Capgen and select the spoken language. Free accounts accept files up to 100 MB.',
      'Generate the captions and preview the words alongside the audio. Select a readable style and a 9:16 canvas.',
      'Export the captioned video and upload the downloaded file to Instagram yourself. Review the final crop and text placement before publishing.',
    ],
    faqs: [
      [
        'Does Capgen connect to my Instagram account?',
        'No. You upload a video file to Capgen and manually upload the exported video to Instagram.',
      ],
      [
        'Can I also download the captions separately?',
        'Yes. SRT download provides timed text for another subtitle workflow; it does not include animation or visual styling.',
      ],
    ],
    related: ['/templates', '/platforms/tiktok', '/use-cases/creators'],
  },
  '/platforms/youtube': {
    title: 'YouTube Shorts caption generator',
    description:
      'Add animated captions to an edited YouTube Short or download SRT subtitles for a video. Capgen transcribes uploaded footage and gives you control over caption styling and canvas shape.',
    eyebrow: 'YOUTUBE SHORTS',
    kind: 'blue',
    section: 'Choose rendered captions or a subtitle file',
    cards: [
      [
        'Captioned Shorts',
        'Use the vertical canvas to prepare a Short with words visibly rendered over the footage. Captions remain part of the exported video file.',
      ],
      [
        'SRT workflow',
        'Download timed subtitle text separately when you need a track for another editor or upload workflow. The SRT file contains no fonts or animated effects.',
      ],
      [
        'Landscape footage',
        'A 16:9 canvas is available for landscape videos. Preview the framing after switching ratios, especially if the source file was shot vertically.',
      ],
      [
        'Speech review',
        'Check channel names, guest names and technical terms against the audio. Background music and overlapping speakers can affect automatic recognition.',
      ],
    ],
    workflowTitle: 'Prepare a captioned Short',
    steps: [
      'Upload the edited clip you own and choose its spoken language. Capgen works with files rather than downloading a YouTube URL.',
      'Generate and preview captions, then choose a style and canvas. Keep the text away from the subject and platform overlays.',
      'Export the video for uploading to YouTube, or download SRT for a separate subtitle track. Preview the uploaded result before publishing.',
    ],
    faqs: [
      [
        'Does Capgen replace YouTube automatic captions?',
        'Capgen is a separate preparation workflow. You can render styled captions into the video or use the SRT file in a supported subtitle upload workflow.',
      ],
      [
        'Does SRT preserve karaoke effects?',
        'No. SRT stores text and timestamps. Use the video export to keep word highlights and animations.',
      ],
    ],
    related: ['/features/srt-subtitles', '/use-cases/podcasters', '/templates'],
  },
  '/platforms/tiktok': {
    title: 'TikTok auto caption and subtitle generator',
    description:
      'Generate subtitles from the speech in your TikTok video before posting. Style timed words in Capgen, preview a vertical canvas, and export a captioned video for manual upload.',
    eyebrow: 'TIKTOK VIDEOS',
    kind: 'purple',
    section: 'Style captions for your short-form clip',
    cards: [
      [
        'Use your own footage',
        'Upload the edited clip you want to post. Capgen captions spoken audio; it does not create footage, music, hooks or TikTok post text.',
      ],
      [
        'Short caption phrases',
        'Adjust how many words appear together and choose an animation. Preview a full sentence to check that viewers can read it at the speaking pace.',
      ],
      [
        'Mobile placement',
        'Choose 9:16 and place the captions around the subject. Test the final file in TikTok so its interface does not cover the wording.',
      ],
      [
        'Export without a watermark',
        'The studio does not add a Capgen watermark. New accounts receive five video credits, with re-exports of an already credited project available without another credit.',
      ],
    ],
    workflowTitle: 'Add subtitles before posting to TikTok',
    steps: [
      'Upload a prepared video file and select the spoken language. Clear audio gives the transcription engine a better starting point.',
      'Generate captions, play the preview and select a font, highlight treatment and animation suited to the footage.',
      'Export the captioned video, then manually upload it to TikTok. Review the text and the crop in the platform preview.',
    ],
    faqs: [
      [
        'Are these hashtag or description captions?',
        'No. Capgen produces subtitles displayed in the video, synchronized with the spoken audio.',
      ],
      [
        'Can I combine Capgen captions with native captions?',
        'Review the result carefully to avoid displaying duplicate text. Capgen video exports already contain the styled captions.',
      ],
    ],
    related: ['/platforms/instagram', '/templates', '/pricing'],
  },
  '/platforms/linkedin': {
    title: 'LinkedIn video caption generator',
    description:
      'Prepare captioned interviews, professional updates and demonstrations for LinkedIn. Generate timed subtitles from uploaded video, choose a clean style and export video or SRT text.',
    eyebrow: 'LINKEDIN VIDEO',
    kind: 'yellow',
    section: 'Keep professional video captions readable',
    cards: [
      [
        'Professional updates',
        'Caption spoken announcements so the message is available as visible text. Use simple type and a restrained highlight treatment for business communication.',
      ],
      [
        'Interviews and expertise',
        'Review job titles, organization names and specialized terms. Automatic speech recognition does not replace checking the wording of a public quotation.',
      ],
      [
        'Demonstrations',
        'Keep captions clear of interface details or a product being shown. A square or landscape canvas may fit the source better than a vertical crop.',
      ],
      [
        'Timed-text handoff',
        'Download SRT to move subtitle text into your existing editing workflow. Exported video keeps the styling visible, while SRT preserves only wording and times.',
      ],
    ],
    workflowTitle: 'Prepare a LinkedIn video with captions',
    steps: [
      'Upload your prepared video and choose the spoken language. Make sure you have permission to process any client or employee footage.',
      'Generate captions, review terminology, and choose a readable style. Preview the available 1:1, 16:9 and 9:16 canvases.',
      'Download the captioned video or SRT file. Upload through your normal LinkedIn workflow and inspect the final presentation.',
    ],
    faqs: [
      [
        'Does Capgen publish to LinkedIn?',
        'No. Export a file and upload it yourself. Capgen does not require a LinkedIn account connection.',
      ],
      [
        'Can I reuse the same video with another style?',
        'Yes. Styling and re-exporting the same credited project does not use an additional video credit.',
      ],
    ],
    related: ['/use-cases/agencies', '/features/srt-subtitles', '/templates'],
  },
  '/about': {
    title: 'About Capgen: a browser-based video caption studio',
    description:
      'Capgen helps people turn speech in an existing video into timed, styled captions. The browser studio brings together video upload, automatic transcription, caption presentation and export.',
    eyebrow: 'ABOUT CAPGEN',
    kind: 'purple',
    section: 'What the product does',
    cards: [
      [
        'Speech to timed text',
        'Upload a video and generate a transcript with word timestamps. Check the generated wording against the recording before using it publicly.',
      ],
      [
        'Caption presentation',
        'Choose caption presets or adjust fonts, colors, placement, animations and words per screen. Visual controls help fit the captions to your footage.',
      ],
      [
        'Two export workflows',
        'Export video with the styled captions rendered into it, or download an SRT subtitle file. SRT stores text and cue times without the visual effects.',
      ],
      [
        'Browser workspace',
        'Editing and video export use browser capabilities. Audio is sent through the transcription service, and signed-in projects can store transcript and style information.',
      ],
    ],
    workflowTitle: 'Understand the workflow before starting',
    steps: [
      'Browse the caption templates and platform guides to decide which output fits your project.',
      'Review Pricing for free credits and upload allowances. An account is required for generation and exports.',
      'Read Privacy for processing details, or contact support with a product question.',
    ],
    faqs: [
      ['Is Capgen a video generator?', 'No. Capgen styles captions on video footage you supply.'],
      [
        'Where can I ask for help?',
        'Email support@capgen.app. Include the browser, device and a description of the issue, without passwords or private payment details.',
      ],
    ],
    related: ['/contact', '/pricing', '/privacy', '/use-cases'],
  },
  '/contact': {
    title: 'Contact Capgen support',
    description:
      'Email support@capgen.app for help with video captions, project exports or account questions. Share the steps that led to the issue so the team can understand what happened.',
    eyebrow: 'CONTACT',
    kind: 'yellow',
    section: 'Send the details that help us investigate',
    cards: [
      [
        'Caption generation',
        'Describe the spoken language, file format and approximate file size. Include the error message and whether the same video plays in your browser.',
      ],
      [
        'Video exports',
        'Include your browser and device, the chosen canvas ratio and what happened during export. Explain whether an SRT download works for the project.',
      ],
      [
        'Accounts and billing',
        'Use the email address associated with your account. Share a receipt reference if relevant; never send passwords, authentication codes or card numbers.',
      ],
      [
        'Feedback and partnerships',
        'Describe the workflow you want to improve or the collaboration you have in mind. Specific examples help the team assess the request.',
      ],
    ],
    workflowTitle: 'How to request support',
    steps: [
      'Email support@capgen.app with a short subject describing the problem.',
      'List the steps to reproduce it and include the device, browser and exact error text.',
      'Share only the information needed to investigate. Ask before sending sensitive footage or personal data.',
    ],
    faqs: [
      [
        'Is a response time guaranteed?',
        'No response-time commitment is published. Email is the public support channel.',
      ],
      [
        'How do I request account data deletion?',
        'Send a request to support@capgen.app using the account email. Read the Privacy page for the data-handling overview.',
      ],
    ],
    related: ['/privacy', '/terms', '/pricing'],
  },
  '/features/srt-subtitles': {
    title: 'SRT subtitle generator for uploaded videos',
    description:
      'Generate timed subtitle text from the audio in your video and download it as an SRT file with Capgen. Use the file in a subtitle editor or another workflow that accepts SubRip subtitles.',
    eyebrow: 'SRT SUBTITLES',
    kind: 'blue',
    section: 'Know what is inside your subtitle file',
    cards: [
      [
        'Text and cue times',
        'An SRT file lists numbered subtitle cues with a start time, end time and the words to display. Capgen builds these cues from the generated transcript.',
      ],
      [
        'A separate text file',
        'Downloading SRT does not burn captions into the footage. Use the video export when you want the styled words to remain visible in the video itself.',
      ],
      [
        'Review before importing',
        'Check names, punctuation, reading speed and timing in a subtitle editor. You can change downloaded text there; Capgen does not currently edit individual transcript words in the studio.',
      ],
      [
        'No animated styling',
        'SRT does not carry Capgen fonts, colors, karaoke highlights or motion presets. The destination video player or editor controls how separate subtitles appear.',
      ],
    ],
    workflowTitle: 'How to generate an SRT file in Capgen',
    steps: [
      'Upload a video you own and choose the spoken language. Sign in to generate its captions.',
      'Generate the transcript and listen to the preview. The available SRT download uses timed phrases from those recognized words.',
      'Choose SRT in the studio toolbar. Open the downloaded .srt file in a text or subtitle editor to review it before import.',
    ],
    faqs: [
      [
        'Can I download VTT or ASS instead?',
        'The current studio provides SRT download. VTT and ASS exports are not available in this workflow.',
      ],
      [
        'Can I upload an existing SRT to Capgen?',
        'The current workflow generates captions from uploaded video audio. SRT import is not available.',
      ],
      [
        'What does a cue look like?',
        'A typical cue has a number, a range such as 00:00:01,200 --> 00:00:03,850, and a line such as Hello world. Cue times are expressed in hours, minutes, seconds and milliseconds.',
      ],
    ],
    related: ['/platforms/youtube', '/use-cases/education', '/templates'],
  },
};

export const LANDING_ROUTES = Object.keys(landingContent);
