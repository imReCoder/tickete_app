import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/database/prisma.service';

@Injectable()
export class SlotsService {
    constructor(private prisma:PrismaService){

    }
}
