import { Module } from '@nestjs/common';
import { SermonController } from './sermon.controller';
import { SermonService } from './sermon.service';
import { AiService } from './ai/ai.service';
import { PptService } from './ppt.service';
import { FileParserService } from './file-parser.service';

@Module({
  controllers: [SermonController],
  providers: [SermonService, AiService, PptService, FileParserService],
})
export class SermonModule {}
