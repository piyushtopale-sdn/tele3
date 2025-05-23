import { Component, OnInit } from "@angular/core";
import * as uuid from "uuid";
import { CoreService } from "./shared/core.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  title = "test_p";

  constructor(
    private  readonly _coreService: CoreService
  ) {
  }

  ngOnInit(): void {
    this.getDeviceId();
    this.setupUUID();
    this.checkInternetConnection();
  }

  async getDeviceId() {
    await this._coreService.getUUID().then((res) => {
      if (!localStorage.getItem("deviceId")) {
        const deviceId = res;
        localStorage.setItem("deviceId", deviceId);
      }
    });
  }

  setupUUID() {
    if (!localStorage.getItem("uuid")) {
      const deviceId = uuid.v4();
      localStorage.setItem("uuid", deviceId);
    }
  }

  checkInternetConnection() {
    if (!navigator.onLine) {
      alert('Check Your Internet Connection');
    }
  }

}
