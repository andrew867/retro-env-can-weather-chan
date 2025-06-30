import { SCREEN_DEFAULT_DISPLAY_LENGTH } from "consts";
import { formatStringTo8x32 } from "lib/display";
import { useEffect, useRef, useState } from "react";
import { AutomaticScreenProps } from "types/screen.types";

type InfoScreenProps = {
  messages: string[];
} & AutomaticScreenProps;


// function SevereTStormExplanationScreen() {
//   return (
//     <div id="stw_explanation">
//       <div>a severe thunderstorm watch is</div>
//       <div>an alert of possible thndrstrms</div>
//       <div>large hail, intense lightning,</div>
//       <div>locally heavy rain or damaging</div>
//       <div>winds in and close to the watch</div>
//       <div>area. persons in and near these</div>
//       <div>areas should be on the lookout</div>
//       <div>for severe weather conditions</div>
//     </div>
//   );
// }

export function InfoScreen(props: InfoScreenProps) {
  const { onComplete, messages } = props ?? {};
  const [page, setPage] = useState(1);
  const [displayedInfoMessage, setDisplayedInfoMessage] = useState<string>();
  const [displayInfoMessages, setDisplayInfoMessages] = useState<string[]>([]);
  const pageChangeTimeout = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    // no info messages so we're done with this screen
    if (!messages?.length) onComplete();
    else {
      const tempMessages: string[] = [...messages];
      // update array of info messages
      setDisplayInfoMessages(tempMessages);
    }
  }, [messages]);

  // page changer
  useEffect(() => {
    if (!displayInfoMessages.length) return;

    // we know we have messages so show the one for the current page
    setDisplayedInfoMessage(displayInfoMessages[page - 1]);

    pageChangeTimeout.current = setTimeout(() => {
      if (page < displayInfoMessages.length) setPage(page + 1);
      else onComplete();
    }, SCREEN_DEFAULT_DISPLAY_LENGTH * 1000);
  }, [page, displayInfoMessages]);

  // used to clear the page switching timeout
  useEffect(() => {
    return () => {
      pageChangeTimeout.current && clearTimeout(pageChangeTimeout.current);
    };
  }, []);


  // display nothing if there's no message content
  if (!displayedInfoMessage?.length) return <></>;

  const infoMessage = displayedInfoMessage.replaceAll("\\n", "\n");

  return (
    <div id="info_screen" className="centre-align">
        <>
          <div className="">
            {infoMessage}
          </div>
        </>
    </div>
  );
}
