import { Controller, Get } from '@nestjs/common';
import { Role } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthUser {
  id: string;
  role: Role;
}

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getStats(user.id, user.role);
  }

  @Get('charts')
  getChartData(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getChartData(user.id, user.role);
  }
}
