import { Controller, Get } from "@nestjs/common";
import { ok } from "../common/api-response";
import { LookupService } from "./lookup.service";

@Controller("lookup")
export class LookupController {
  constructor(private readonly lookupService: LookupService) {}

  @Get("sat/dates")
  async satDates() {
    const data = await this.lookupService.getSatDates();
    return ok(data);
  }

  @Get("hsa/schedule")
  async hsaSchedule() {
    const data = await this.lookupService.getHsaSchedule();
    return ok(data);
  }
}
