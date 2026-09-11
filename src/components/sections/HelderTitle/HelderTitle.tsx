import styles from "./helder-title.module.scss";

export interface HelderTitleProps {
  text: string;
}

function HelderTitle({ text }: HelderTitleProps) {
  return (
    <section className={`section ${styles.helderTitle}`}>
      <div className="layout__content">
        <h2>{text}</h2>
      </div>
    </section>
  );
}

export default HelderTitle;
