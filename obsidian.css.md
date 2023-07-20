.container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.box {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.arrow {
  position: absolute;
  bottom: -20px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid black;
}

.box:first-child .arrow {
  display: none;
}

.box:last-child {
  margin-bottom: 40px;
}
