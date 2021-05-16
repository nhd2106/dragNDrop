export const ondropActivate = (e) => {
    e.target.classList.add('drop-active');
  };
  export const onDragEnter = (e) => {
    const draggableElement = e.relatedTarget;
    const dropzoneElement = e.target;
    dropzoneElement.classList.add('drop-target');
    draggableElement.classList.add('can-drop');
    draggableElement.classList.remove('dropped-out');
  };
  export const onDragLeave = (e) => {
    e.target.classList.remove('drop-target');
    e.relatedTarget.classList.remove('can-drop');
    e.relatedTarget.classList.add('dropped-out');
  };
  export const onDropDeacTivate = (e) => {
    e.target.classList.remove('drop-active');
    e.target.classList.remove('drop-target');
  };
  