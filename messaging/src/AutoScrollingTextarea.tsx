import React from 'react';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>
class AutoScrollingTextarea extends React.Component<TextareaProps & { autoScroll?: boolean }, {}> {

  private element: HTMLTextAreaElement | null

  constructor(props: TextareaProps) {
    super(props);
    this.element = null;
  }

  componentDidMount() {
    if (this.element && this.props.autoScroll !== false) {
      this.element.scrollTop = this.element.scrollHeight
    }
  }

  componentDidUpdate(prevProps: TextareaProps, prevState: {}) {
    if (prevProps.value !== this.props.value && this.element && this.props.autoScroll !== false) {
      this.element.scrollTop = this.element.scrollHeight
    }
  }

  render() {
    return <textarea {...this.props} ref={e => this.element = e} />
  }
}

export default AutoScrollingTextarea
