import Marquee from "react-fast-marquee";
import { coerceArray } from "lib/display/safeData";
import { CrawlerMessages } from "types";

type CrawlerMessagesProps = {
  crawler: CrawlerMessages;
};

export function CrawlerMessages({ crawler }: CrawlerMessagesProps) {
  const lines = coerceArray<string>(crawler);
  if (!lines.length) return <div id="crawler"></div>;

  return (
    <div id="crawler">
      <Marquee loop={0} speed={125}>
        <div className="message"></div>
        {lines.map((message, ix) => (
          <div className="message" key={`crawler.${ix}`}>
            {message}
          </div>
        ))}
      </Marquee>
    </div>
  );
}
